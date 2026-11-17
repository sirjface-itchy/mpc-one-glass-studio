import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3030;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const SDK_ROOT = path.join(__dirname, 'mpc-plugin-builder-sdk');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.zip': 'application/zip',
  '.xpj': 'application/octet-stream'
};

function loadArsenal() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'inmusic_arsenal.json'), 'utf8'));
  } catch (e) {
    return {};
  }
}

function listAvailableDrives() {
  const drives = [];
  // Local workspace VST2 Plugins folder
  const localVstDir = path.join(__dirname, 'VST2 Plugins');
  drives.push({
    id: 'workspace',
    label: '📁 Workspace Local (/Documents/MPC Bible/VST2 Plugins)',
    targetDir: localVstDir,
    available: true
  });

  // Check /Volumes for SD cards, USB sticks, and user's MPC One SD backup
  try {
    const vols = fs.readdirSync('/Volumes');
    for (const v of vols) {
      if (v === 'Macintosh HD' || v.startsWith('.')) continue;
      const volPath = path.join('/Volumes', v);
      try {
        const stat = fs.statSync(volPath);
        if (!stat.isDirectory()) continue;

        // Check if this volume has "SD MPC ONE SAVE" (like base SSD)
        const mpcSaveSubdir = path.join(volPath, 'SD MPC ONE SAVE');
        if (fs.existsSync(mpcSaveSubdir)) {
          drives.push({
            id: `vol_${v}_mpcsave`,
            label: `💾 Sauvegarde Carte SD MPC One (/Volumes/${v}/SD MPC ONE SAVE/VST2 Plugins)`,
            targetDir: path.join(mpcSaveSubdir, 'VST2 Plugins'),
            available: true
          });
        }

        drives.push({
          id: `vol_${v}`,
          label: `🔌 Disque / Clé USB / Carte SD (/Volumes/${v}/VST2 Plugins)`,
          targetDir: path.join(volPath, 'VST2 Plugins'),
          available: true
        });
      } catch (_) {}
    }
  } catch (_) {}

  return drives;
}

function copyDirectoryRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/arsenal' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(loadArsenal()));
    return;
  }

  if (url.pathname === '/api/drives' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ drives: listAvailableDrives() }));
    return;
  }

  // Real Official MPC Plugin SDK Compiler + Host Simulator + Deployer
  if (url.pathname === '/api/compile-sdk-plugin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const folderName = (payload.folderName || 'Arnaud Vinyl Crusher').replace(/["#@,;:<>*^|?\\/]/g, '').trim();
        const vendor = (payload.vendor || 'Arnaud Rigogne').replace(/["#@,;:<>*^|?\\/]/g, '').trim();
        const className = payload.className || 'ArnaudVinylCrusher';
        const pluginDir = path.join(SDK_ROOT, 'plugins', folderName);
        const srcDir = path.join(pluginDir, 'src');

        // Clean previous build if re-compiling
        if (fs.existsSync(pluginDir)) {
          fs.rmSync(pluginDir, { recursive: true, force: true });
        }
        fs.mkdirSync(srcDir, { recursive: true });

        // 1. Write official MPC SDK project files
        fs.writeFileSync(path.join(pluginDir, 'plugin.json'), payload.pluginJson, 'utf8');
        fs.writeFileSync(path.join(pluginDir, 'ui.json'), payload.uiJson, 'utf8');
        fs.writeFileSync(path.join(srcDir, `${className}.cpp`), payload.cppCode, 'utf8');
        fs.writeFileSync(path.join(pluginDir, 'README.md'), `# ${folderName}\n\nBuilt with Akai MPC Plugin SDK (OS 3.10.1) by ${vendor}.\n`, 'utf8');

        let wavStatusMsg = '';
        const samplesDir = path.join(pluginDir, 'Content', 'Samples');
        if (payload.wavBase64 && typeof payload.wavBase64 === 'string') {
          const cleanB64 = payload.wavBase64.replace(/^data:[^;]+;base64,/, '');
          const wavBuf = Buffer.from(cleanB64, 'base64');
          fs.mkdirSync(samplesDir, { recursive: true });
          fs.writeFileSync(path.join(samplesDir, 'instrument.wav'), wavBuf);
          wavStatusMsg += `\nSample audio intégré : Content/Samples/instrument.wav (${(wavBuf.length / 1024).toFixed(1)} KB)`;
        }
        if (payload.wavZonesBase64 && typeof payload.wavZonesBase64 === 'object') {
          for (const zone of ['low', 'mid', 'high']) {
            const b64 = payload.wavZonesBase64[zone];
            if (b64 && typeof b64 === 'string') {
              const cleanB64 = b64.replace(/^data:[^;]+;base64,/, '');
              const wavBuf = Buffer.from(cleanB64, 'base64');
              fs.mkdirSync(samplesDir, { recursive: true });
              fs.writeFileSync(path.join(samplesDir, `${zone}.wav`), wavBuf);
              wavStatusMsg += `\nZone ${zone}.wav intégrée (${(wavBuf.length / 1024).toFixed(1)} KB)`;
            }
          }
        }

        if (payload.knobImageBase64 && typeof payload.knobImageBase64 === 'string') {
          const cleanB64 = payload.knobImageBase64.replace(/^data:[^;]+;base64,/, '');
          const imgBuf = Buffer.from(cleanB64, 'base64');
          const imgName = (payload.knobImageName || 'custom_knob.png').replace(/[^a-zA-Z0-9._-]/g, '_');
          const assetsDir = path.join(pluginDir, 'assets');
          fs.mkdirSync(assetsDir, { recursive: true });
          fs.writeFileSync(path.join(assetsDir, imgName), imgBuf);
          wavStatusMsg += `\nVisuel PNG Film-Strip intégré : assets/${imgName} (${(imgBuf.length / 1024).toFixed(1)} KB)`;
        }

        let fullLog = `=== [ÉTAPE 1] CRÉATION DU PROJET SDK OFFICIEL ===\nDossier : ${pluginDir}\nFichiers écrits : plugin.json, ui.json, src/${className}.cpp${wavStatusMsg}\n\n`;

        // 2. Run python3 tools/build.py (compiles Native + ARM32 for MPC One + ARM64 + Skins TUI.json + Q-Links.json + Validate)
        const buildScript = path.join(SDK_ROOT, 'tools', 'build.py');
        fullLog += `=== [ÉTAPE 2] CROSS-COMPILATION ARM32 (MPC ONE) & ARM64 + GÉNÉRATION SKINS ===\n$ python3 tools/build.py "${pluginDir}"\n`;
        const buildRes = await execFileAsync('python3', [buildScript, pluginDir], {
          cwd: SDK_ROOT,
          timeout: 120000
        });
        fullLog += (buildRes.stdout || '') + (buildRes.stderr || '') + '\n';

        // 3. Run host_sim automated MPC hardware test & render WAV preview
        const slug = payload.slug;
        const nativeDylib = path.join(pluginDir, 'build', 'native', `${slug}.dylib`);
        const testWavPath = path.join(PUBLIC_DIR, 'builds', `${slug}-test.wav`);
        fs.mkdirSync(path.join(PUBLIC_DIR, 'builds'), { recursive: true });

        const hostSimBin = path.join(SDK_ROOT, '.sdk-tools', 'host_sim');
        if (fs.existsSync(hostSimBin) && fs.existsSync(nativeDylib)) {
          fullLog += `=== [ÉTAPE 3] SIMULATION HÔTE MPC (HOST_SIM) & RENDU AUDIO WAV ===\n`;
          const simRes = await execFileAsync(hostSimBin, [nativeDylib, 'test', '--wav', testWavPath], {
            cwd: SDK_ROOT,
            timeout: 30000
          });
          fullLog += (simRes.stdout || '') + (simRes.stderr || '') + '\n';
        }

        // 4. Run package.py to create a downloadable .zip archive
        const packageScript = path.join(SDK_ROOT, 'tools', 'package.py');
        const pkgRes = await execFileAsync('python3', [packageScript, pluginDir], {
          cwd: SDK_ROOT,
          timeout: 30000
        });
        fullLog += `=== [ÉTAPE 4] PACKAGING ZIP & DÉPLOIEMENT VERS "VST2 Plugins" ===\n` + (pkgRes.stdout || '');

        // Locate built output folder "<Vendor> - VST - <Name>"
        const bundleFolderName = `${vendor} - VST - ${folderName}`;
        const builtBundleDir = path.join(pluginDir, 'build', bundleFolderName);

        // Copy zip to public/builds for 1-click download in browser
        const buildFiles = fs.readdirSync(path.join(pluginDir, 'build'));
        const zipFile = buildFiles.find(f => f.endsWith('.zip'));
        let publicZipUrl = null;
        if (zipFile) {
          fs.copyFileSync(
            path.join(pluginDir, 'build', zipFile),
            path.join(PUBLIC_DIR, 'builds', zipFile)
          );
          publicZipUrl = `/builds/${encodeURIComponent(zipFile)}`;
        }

        // 5. Copy compiled bundle directly into target "VST2 Plugins" folder
        const drives = listAvailableDrives();
        const selectedDrive = drives.find(d => d.id === payload.targetDriveId) || drives[0];
        const deployedPluginPath = path.join(selectedDrive.targetDir, bundleFolderName);
        copyDirectoryRecursive(builtBundleDir, deployedPluginPath);

        // Also always mirror to local workspace VST2 Plugins if another drive was chosen
        const localVstDir = path.join(__dirname, 'VST2 Plugins', bundleFolderName);
        if (deployedPluginPath !== localVstDir) {
          copyDirectoryRecursive(builtBundleDir, localVstDir);
        }

        fullLog += `\n✅ DÉPLOYÉ AVEC SUCCÈS DANS :\n👉 ${deployedPluginPath}\n`;

        // List generated files inside the bundle
        const generatedFiles = [
          `plugin.json`,
          `version.xml`,
          `VST/${slug}-arm32.so (Binaire MPC One / Live / X)`,
          `VST/${slug}-arm64.so (Binaire MPC Live III / XL)`,
          `Plugin Skins/TUI.json (Interface tactile 7" générée)`,
          `Plugin Skins/Q-Links.json (Mapping des 4 Q-Links MPC One)`
        ];

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          bundleName: bundleFolderName,
          deployedPath: deployedPluginPath,
          localMirrorPath: localVstDir,
          zipUrl: publicZipUrl,
          wavUrl: fs.existsSync(testWavPath) ? `/builds/${encodeURIComponent(slug)}-test.wav?t=${Date.now()}` : null,
          files: generatedFiles,
          log: fullLog
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: err.message,
          log: (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message
        }));
      }
    });
    return;
  }

  // Real MPC One Standalone .xpj Template Generator
  if (url.pathname === '/api/generate-template' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawName = (payload.projectName || 'MPC_One_Template').trim();
        const safeName = rawName.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'MPC_One_Template';
        const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const bpm = Math.max(40, Math.min(240, Number(payload.bpm) || 90));
        const bars = Math.max(1, Math.min(64, Number(payload.bars) || 4));
        const tracksConfig = Array.isArray(payload.tracks) ? payload.tracks : [];
        const guideText = payload.guideText || '';

        const basePath = path.join(DATA_DIR, 'mpc_base_template.json');
        if (!fs.existsSync(basePath)) {
          throw new Error('mpc_base_template.json introuvable dans data/');
        }
        const tpl = JSON.parse(fs.readFileSync(basePath, 'utf8'));
        const d = tpl.root.data;

        d.masterTempo = bpm;
        d.masterTempoEnabled = true;
        if (d.sequences && d.sequences[0] && d.sequences[0].value) {
          d.sequences[0].value.name = `${safeName} - Main`;
          d.sequences[0].value.bpm = bpm;
          d.sequences[0].value.lengthBars = bars;
          d.sequences[0].value.loopStartBar = 0;
          d.sequences[0].value.loopEndBar = bars;
          d.sequences[0].value.loop = true;
        }

        // Verified MPC OS 3.x Plugin & FX Descriptors extracted from user's MPC One projects
        const FX_MAP = {
          'AIR Flavor': { version: 1, name: 'AIR Flavor', descriptiveName: 'AIR Flavor', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Flavor', uid: 1481655884, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Lo-Fi': { version: 1, name: 'AIR Lo-Fi', descriptiveName: 'AIR Lo-Fi', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Lo-Fi', uid: 1631996998, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'SP1200': { version: 1, name: 'SP1200', descriptiveName: 'SP1200', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'SP1200', uid: 1094940263, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Maximizer': { version: 1, name: 'AIR Maximizer', descriptiveName: 'AIR Maximizer', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Maximizer', uid: 1631997304, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Limiter': { version: 1, name: 'AIR Limiter', descriptiveName: 'AIR Limiter', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Limiter', uid: 1631997037, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Bus Compressor': { version: 1, name: 'Bus Compressor', descriptiveName: 'Bus Compressor', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Bus Compressor', uid: 1094932042, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Compressor Vintage': { version: 1, name: 'Compressor Vintage', descriptiveName: 'Compressor Vintage', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Compressor Vintage', uid: 1094932041, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Delay': { version: 1, name: 'AIR Delay', descriptiveName: 'AIR Delay', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Delay', uid: 1631994988, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Diff Delay': { version: 1, name: 'AIR Diff Delay', descriptiveName: 'AIR Diff Delay', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Diff Delay', uid: 1631994948, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Distortion': { version: 1, name: 'AIR Distortion', descriptiveName: 'AIR Distortion', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Distortion', uid: 1631994995, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Tube Drive': { version: 1, name: 'AIR Tube Drive', descriptiveName: 'AIR Tube Drive', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Tube Drive', uid: 1631999044, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'AIR Stutter': { version: 1, name: 'AIR Stutter', descriptiveName: 'AIR Stutter', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Stutter', uid: 1631998836, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Flex Beat Player': { version: 1, name: 'Flex Beat Player', descriptiveName: 'Flex Beat Player', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Flex Beat Player', uid: 1179402832, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Mother Ducker': { version: 1, name: 'Mother Ducker', descriptiveName: 'Mother Ducker', pluginFormatName: 'MPC', category: 'Dynamics', manufacturerName: 'Akai Professional', fileOrIdentifier: 'MotherDuckerOutput', uid: 1094940244, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Mother Ducker Input': { version: 1, name: 'Mother Ducker Input', descriptiveName: 'Mother Ducker Input', pluginFormatName: 'MPC', category: 'Dynamics', manufacturerName: 'Akai Professional', fileOrIdentifier: 'MotherDuckerInput', uid: 1094932052, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'PEQ 4-Band': { version: 1, name: 'PEQ 4-Band', descriptiveName: 'PEQ 4-Band', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'PEQ 4-Band', uid: 1094932070, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
          'Granulator': { version: 1, name: 'Granulator', descriptiveName: 'Granulator', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Granulator', uid: 1229866834, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 }
        };

        const INST_MAP = {
          'Sub Factory': { version: 1, name: 'Sub Factory', descriptiveName: 'Sub Factory', pluginFormatName: 'Qubiq', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'Qubiq:SubFactory', uid: 1397511238, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
          'Hype': { version: 1, name: 'Hype', descriptiveName: 'Hype', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:Hype', uid: 1399673721, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
          'Bassline': { version: 1, name: 'Bassline', descriptiveName: 'Bassline', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:Bassline', uid: 1114860654, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
          'TubeSynth': { version: 1, name: 'TubeSynth', descriptiveName: 'TubeSynth', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:TubeSynth', uid: 1415730041, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 }
        };

        // Map track configs onto the 4 main tracks (index 0,1 = Drum, index 2,3 = Plugin)
        for (let i = 0; i < Math.min(4, tracksConfig.length); i++) {
          const cfg = tracksConfig[i];
          const tr = d.tracks[i];
          if (!tr) continue;
          if (cfg.name) {
            tr.name = cfg.name;
            tr.program.name = cfg.name;
          }
          if (cfg.instrument && INST_MAP[cfg.instrument] && tr.program.type === 3 && tr.program.plugin && tr.program.plugin.plugin) {
            tr.program.plugin.plugin.description = INST_MAP[cfg.instrument];
            tr.program.plugin.plugin.state = '';
            tr.program.plugin.plugin.presetName = 'Init';
            tr.program.plugin.plugin.programNumber = 0;
          }
          if (Array.isArray(cfg.fx)) {
            const effects = [];
            cfg.fx.forEach((fxName, idx) => {
              const desc = FX_MAP[fxName];
              if (desc) {
                effects.push({
                  index: idx,
                  plugin: {
                    version: 2,
                    is64Bits: false,
                    description: desc,
                    state: '',
                    programNumber: 0,
                    presetName: 'Init',
                    presetEdited: false
                  },
                  enable: true
                });
              }
            });
            tr.program.mixable.inserts = { insertsEnabled: true, effects };
          }
        }

        const xpjString = tpl.header + JSON.stringify(tpl.root);
        const xpjBuffer = zlib.gzipSync(Buffer.from(xpjString, 'utf8'));

        const publicBuildsDir = path.join(PUBLIC_DIR, 'builds', 'templates');
        const workBundleDir = path.join(publicBuildsDir, slug);
        fs.rmSync(workBundleDir, { recursive: true, force: true });
        fs.mkdirSync(path.join(workBundleDir, `${safeName}_[ProjectData]`), { recursive: true });

        const xpjFileName = `${safeName}.xpj`;
        const xpjPath = path.join(workBundleDir, xpjFileName);
        fs.writeFileSync(xpjPath, xpjBuffer);

        // Also expose standalone .xpj directly for single-file download
        const publicXpjPath = path.join(publicBuildsDir, xpjFileName);
        fs.writeFileSync(publicXpjPath, xpjBuffer);

        const guideFileName = `GUIDE_${slug}.txt`;
        fs.writeFileSync(
          path.join(workBundleDir, guideFileName),
          `MPC ONE STANDALONE TEMPLATE — ${safeName}\nTempo: ${bpm} BPM | Longueur: ${bars} mesures\n\nINSTALLATION SUR CARTE SD :\n1. Copie "${xpjFileName}" et le dossier "${safeName}_[ProjectData]" à la racine de ta Carte SD (ou dans ton dossier Projects/).\n2. Sur ta MPC One : appuie sur BROWSE -> sélectionne ta Carte SD -> touche "${xpjFileName}" -> Load.\n\n${guideText}\n`,
          'utf8'
        );

        const zipFileName = `${slug}-mpc-one-template.zip`;
        const zipPath = path.join(publicBuildsDir, zipFileName);
        fs.rmSync(zipPath, { force: true });
        await execFileAsync('zip', ['-r', zipPath, xpjFileName, `${safeName}_[ProjectData]`, guideFileName], { cwd: workBundleDir });

        // Optional direct copy to selected SD card / drive
        let deployedPath = null;
        if (payload.deployToDrive && payload.targetDriveId) {
          const drives = listAvailableDrives();
          const chosen = drives.find(dr => dr.id === payload.targetDriveId);
          if (chosen) {
            // Deploy to parent of VST2 Plugins (drive root / SD save root) inside "Templates MPC One"
            const driveRoot = path.dirname(chosen.targetDir);
            const destFolder = path.join(driveRoot, 'Templates MPC One');
            fs.mkdirSync(path.join(destFolder, `${safeName}_[ProjectData]`), { recursive: true });
            fs.copyFileSync(xpjPath, path.join(destFolder, xpjFileName));
            deployedPath = path.join(destFolder, xpjFileName);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          fileName: xpjFileName,
          zipUrl: `/builds/templates/${encodeURIComponent(zipFileName)}?t=${Date.now()}`,
          xpjUrl: `/builds/templates/${encodeURIComponent(xpjFileName)}?t=${Date.now()}`,
          deployedPath,
          sizeBytes: xpjBuffer.length
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Scan existing .xpj projects on SD Save / Workspace
  if (url.pathname === '/api/projects' && req.method === 'GET') {
    const scanDirs = [
      '/Volumes/base SSD/SD MPC ONE SAVE',
      path.join(__dirname, 'Templates MPC One')
    ].filter(dir => fs.existsSync(dir));

    const projects = [];
    for (const dir of scanDirs) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.xpj')) continue;
          const fullPath = path.join(dir, entry.name);
          const stat = fs.statSync(fullPath);
          let bpm = null, trackCount = 0, plugins = [], hasProjectData = false;
          const baseName = entry.name.slice(0, -4);
          hasProjectData = fs.existsSync(path.join(dir, `${baseName}_[ProjectData]`));
          try {
            const raw = zlib.gunzipSync(fs.readFileSync(fullPath)).toString('utf8');
            const jsonStart = raw.indexOf('{');
            if (jsonStart >= 0) {
              const parsed = JSON.parse(raw.slice(jsonStart));
              const d = parsed.data || parsed;
              bpm = d.masterTempo || d.sequences?.[0]?.value?.bpm || null;
              const tracks = d.tracks || [];
              trackCount = tracks.length;
              const pSet = new Set();
              for (const tr of tracks) {
                const inst = tr.program?.plugin?.plugin?.description?.name;
                if (inst) pSet.add(inst);
                const effs = tr.program?.mixable?.inserts?.effects || [];
                for (const ef of effs) {
                  const fx = ef.plugin?.description?.name;
                  if (fx) pSet.add(fx);
                }
              }
              plugins = [...pSet];
            }
          } catch (_) {}
          projects.push({
            name: baseName,
            fileName: entry.name,
            folder: dir,
            sizeKB: Math.round(stat.size / 1024),
            modified: stat.mtime.toISOString().slice(0, 10),
            bpm: bpm ? Math.round(bpm * 10) / 10 : null,
            trackCount,
            plugins,
            hasProjectData
          });
        }
      } catch (_) {}
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, scanDirs, projects }));
    return;
  }

  // Incremental SD Card Backup -> /Volumes/base SSD/SD MPC ONE SAVE (or local backup)
  if (url.pathname === '/api/backup-sd' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const drives = listAvailableDrives();
        const srcDrive = drives.find(d => d.id === payload.sourceDriveId);
        if (!srcDrive) throw new Error('Disque source introuvable.');
        const srcRoot = path.dirname(srcDrive.targetDir);
        const destRoot = fs.existsSync('/Volumes/base SSD/SD MPC ONE SAVE')
          ? '/Volumes/base SSD/SD MPC ONE SAVE'
          : path.join(__dirname, 'SD_BACKUP');
        fs.mkdirSync(destRoot, { recursive: true });

        if (path.resolve(srcRoot) === path.resolve(destRoot)) {
          throw new Error('La source et la destination de sauvegarde sont identiques.');
        }

        let copiedFiles = 0;
        let skippedFiles = 0;
        const entries = fs.readdirSync(srcRoot, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          if (entry.isFile() && entry.name.toLowerCase().endsWith('.xpj')) {
            const sPath = path.join(srcRoot, entry.name);
            const dPath = path.join(destRoot, entry.name);
            const sStat = fs.statSync(sPath);
            if (!fs.existsSync(dPath) || sStat.mtimeMs > fs.statSync(dPath).mtimeMs) {
              fs.copyFileSync(sPath, dPath);
              copiedFiles++;
            } else {
              skippedFiles++;
            }
          } else if (entry.isDirectory() && (entry.name.endsWith('_[ProjectData]') || entry.name === 'VST2 Plugins')) {
            const sDir = path.join(srcRoot, entry.name);
            const dDir = path.join(destRoot, entry.name);
            copyDirectoryRecursive(sDir, dDir);
            copiedFiles++;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, srcRoot, destRoot, copiedFiles, skippedFiles }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  let decodedPathname = decodeURIComponent(url.pathname);
  let filePath = decodedPathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, decodedPathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`MPC One Glass Studio running at http://localhost:${PORT}`);
});

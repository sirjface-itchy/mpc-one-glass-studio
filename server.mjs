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
        } else if (payload.presetKnobImage && typeof payload.presetKnobImage === 'string') {
          const safeImg = path.basename(payload.presetKnobImage).replace(/[^a-zA-Z0-9._-]/g, '_');
          const srcImg = path.join(PUBLIC_DIR, 'assets', 'filmstrips', safeImg);
          if (fs.existsSync(srcImg)) {
            const assetsDir = path.join(pluginDir, 'assets');
            fs.mkdirSync(assetsDir, { recursive: true });
            fs.copyFileSync(srcImg, path.join(assetsDir, safeImg));
            wavStatusMsg += `\nModèle PNG Film-Strip Studio intégré : assets/${safeImg}`;
          }
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

        // Optional: inject authentic MPC OS 3.x MIDI starter groove (Drums on Track 1 + Bass on Track 3)
        if (payload.includeGroove !== false && d.sequences && d.sequences[0] && d.sequences[0].value) {
          const makeNoteEv = (time, note, vel = 0.9, length = 240) => ({
            version: 1, time, type: 3, selected: false, muted: false, invented: false,
            note: {
              version: 1, note, velocity: vel, length, probability: 100, ratchet: 1,
              modifierValue0: 0.5, modifierActiveState0: false, modifierValue1: 0.5, modifierActiveState1: false,
              modifierValue2: 0.0, modifierActiveState2: false, modifierValue3: 0.0, modifierActiveState3: false,
              modifierValue4: 0.0, modifierActiveState4: false, modifierValue5: 0.5, modifierActiveState5: false,
              modifierValue6: 1.0, modifierActiveState6: false, modifierValue7: 0.0, modifierActiveState7: false,
              modifierValue8: 0.0, modifierActiveState8: false, modifierValue9: 0.0, modifierActiveState9: false,
              modifierValue10: 0.0, modifierActiveState10: false, modifierValue11: 0.0, modifierActiveState11: false,
              modifierValue12: 0.0, modifierActiveState12: false, modifierValue13: 0.0, modifierActiveState13: false,
              modifierValue14: 0.0, modifierActiveState14: false, modifierValue15: 0.0, modifierActiveState15: false,
              'EnumCerealisationWrapper(selectedModifierType)': 'Tuning (coarse)'
            }
          });
          const style = payload.templateId || 'boombap';
          const barPulses = 3840;
          const totalPulses = bars * barPulses;
          const drumEvents = [];
          const bassEvents = [];
          const patterns = {
            boombap:    { k: [0, 1440, 2400, 3360], s: [960, 2880], h: [0, 480, 960, 1440, 1920, 2400, 2880, 3360], b: [[0, 36, 960], [1440, 39, 960], [2400, 41, 960]] },
            lofi:       { k: [0, 1440, 2160],       s: [960, 2880], h: [0, 520, 960, 1480, 1920, 2440, 2880, 3400], b: [[0, 36, 1440], [1920, 43, 1440]] },
            trap:       { k: [0, 1200, 2640],       s: [1920],      h: [0, 240, 480, 720, 960, 1200, 1440, 1680, 1920, 2160, 2400, 2640, 2880, 3120, 3360, 3600], b: [[0, 36, 1200], [1200, 36, 1200], [2640, 37, 960]] },
            neosoul:    { k: [0, 1680, 2400],       s: [960, 2880], h: [0, 480, 960, 1440, 1920, 2400, 2880, 3360], b: [[0, 38, 1200], [1920, 41, 1440]] },
            synthwave:  { k: [0, 960, 1920, 2880],  s: [960, 2880], h: [0, 480, 960, 1440, 1920, 2400, 2880, 3360], b: [[0, 33, 480], [480, 33, 480], [960, 33, 480], [1440, 33, 480], [1920, 36, 480], [2400, 36, 480], [2880, 38, 480], [3360, 38, 480]] },
            afro:       { k: [0, 720, 1440, 2400, 3120], s: [720, 1680, 2640], h: [0, 480, 960, 1440, 1920, 2400, 2880, 3360], b: [[0, 36, 720], [1440, 41, 720], [2400, 39, 960]] },
            frenchtouch:{ k: [0, 960, 1920, 2880],  s: [960, 2880], h: [480, 1440, 2400, 3360], b: [[0, 36, 480], [720, 36, 480], [1440, 39, 480], [2400, 41, 720]] },
            techno:     { k: [0, 960, 1920, 2880],  s: [960, 2880], h: [480, 1440, 2400, 3360], b: [[240, 36, 240], [720, 36, 240], [1200, 36, 240], [1680, 36, 240], [2160, 36, 240], [2640, 36, 240], [3120, 36, 240], [3600, 36, 240]] },
            westcoast:  { k: [0, 1680, 2160],       s: [960, 2880], h: [0, 480, 960, 1440, 1920, 2400, 2880, 3360], b: [[0, 36, 960], [1440, 39, 480], [1920, 41, 960], [3120, 43, 480]] }
          };
          const pat = patterns[style] || patterns.boombap;
          for (let bar = 0; bar < bars; bar++) {
            const base = bar * barPulses;
            pat.k.forEach(t => drumEvents.push(makeNoteEv(base + t, 36, 0.95, 240)));
            pat.s.forEach(t => drumEvents.push(makeNoteEv(base + t, 37, 0.90, 240)));
            pat.h.forEach(t => drumEvents.push(makeNoteEv(base + t, 42, 0.72, 180)));
            pat.b.forEach(([t, n, len]) => bassEvents.push(makeNoteEv(base + t, n, 0.88, len)));
          }
          drumEvents.sort((a, b) => a.time - b.time);
          bassEvents.sort((a, b) => a.time - b.time);
          const makeClip = (trackName, events) => ({
            key: trackName,
            value: {
              version: 1, launchQuantisation: 1, startPulses: 0, endPulses: totalPulses,
              loopStartPulses: 0, loopEndPulses: totalPulses, loop: true, legato: true, launch: 0,
              name: trackName, colour: 0,
              eventList: { length: 9223372036854775807, events }
            }
          });
          d.sequences[0].value.trackClipMaps = [[
            makeClip(d.tracks[0].name, drumEvents),
            makeClip(d.tracks[2].name, bassEvents)
          ]];
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

  // Local AI Stem Separator (Demucs htdemucs -> drums, bass, vocals, other .wav)
  if (url.pathname === '/api/separate-stems' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.wavBase64) throw new Error('Audio .wav manquant');
        const rawName = (payload.fileName || 'track').replace(/\.[^.]+$/, '');
        const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
        const stemBaseDir = path.join(PUBLIC_DIR, 'builds', 'stems', slug);
        fs.rmSync(stemBaseDir, { recursive: true, force: true });
        fs.mkdirSync(stemBaseDir, { recursive: true });

        const cleanB64 = payload.wavBase64.replace(/^data:[^;]+;base64,/, '');
        const inputWav = path.join(stemBaseDir, 'input.wav');
        fs.writeFileSync(inputWav, Buffer.from(cleanB64, 'base64'));

        const pyBin = path.join(__dirname, '.stem-tools', 'venv', 'bin', 'python');
        const pyScript = path.join(__dirname, '.stem-tools', 'run_stems.py');
        if (!fs.existsSync(pyBin) || !fs.existsSync(pyScript)) {
          throw new Error('Environnement Demucs (.stem-tools) introuvable.');
        }

        await execFileAsync(pyBin, [pyScript, inputWav, stemBaseDir], {
          cwd: __dirname,
          timeout: 300000
        });

        const stemNames = ['drums', 'bass', 'vocals', 'other'].filter(s => fs.existsSync(path.join(stemBaseDir, `${s}.wav`)));
        const zipName = `${slug}-stems-mpc.zip`;
        const zipPath = path.join(PUBLIC_DIR, 'builds', 'stems', zipName);
        fs.rmSync(zipPath, { force: true });
        await execFileAsync('zip', ['-j', zipPath, ...stemNames.map(s => path.join(stemBaseDir, `${s}.wav`))]);

        let deployedDir = null;
        if (payload.copyToDrive && payload.targetDriveId) {
          const drives = listAvailableDrives();
          const chosen = drives.find(d => d.id === payload.targetDriveId);
          if (chosen) {
            const driveRoot = path.dirname(chosen.targetDir);
            deployedDir = path.join(driveRoot, 'Samples', `Stems_${slug}`);
            fs.mkdirSync(deployedDir, { recursive: true });
            for (const s of stemNames) {
              fs.copyFileSync(path.join(stemBaseDir, `${s}.wav`), path.join(deployedDir, `${slug}_${s}.wav`));
            }
          }
        }

        const t = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          slug,
          stems: stemNames.map(s => ({ name: s, url: `/builds/stems/${encodeURIComponent(slug)}/${s}.wav?t=${t}` })),
          zipUrl: `/builds/stems/${encodeURIComponent(zipName)}?t=${t}`,
          deployedDir
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Hybrid Copilot: Local RAG KB + Arsenal + Live Online Web Confirmation + Optional Gemini
  if (url.pathname === '/api/ask-copilot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const question = (payload.question || '').trim();
        if (!question) throw new Error('Question vide');
        const lower = question.toLowerCase();

        // 1. Search Local RAG KB
        let kbList = [];
        try {
          kbList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'mpc_rag_kb.json'), 'utf8'));
        } catch (_) {}

        let bestKb = null;
        let bestScore = 0;
        const tokens = lower.split(/[^a-z0-9àâéèêëîïôùûüç]+/).filter(t => t.length >= 3);
        for (const item of kbList) {
          let score = 0;
          for (const kw of item.keywords || []) {
            if (lower.includes(kw.toLowerCase())) score += 10;
          }
          const hay = `${item.title} ${item.summary} ${(item.steps || []).join(' ')}`.toLowerCase();
          for (const tok of tokens) {
            if (hay.includes(tok)) score += 2;
          }
          if (score > bestScore) {
            bestScore = score;
            bestKb = item;
          }
        }
        if (bestScore < 6) bestKb = null;

        // 2. Search inMusic Arsenal
        const arsenal = loadArsenal();
        const arsenalMatches = [];
        const allItems = [
          ...(arsenal.software_and_plugins?.standalone_instruments || []),
          ...(arsenal.software_and_plugins?.standalone_effects_and_packs || []),
          ...(arsenal.software_and_plugins?.expansions || [])
        ];
        for (const it of allItems) {
          const text = `${it.name || ''} ${it.style || ''} ${(it.includes || []).join(' ')} ${it.genre || ''}`.toLowerCase();
          if (tokens.some(t => t.length >= 4 && text.includes(t))) {
            arsenalMatches.push(it);
          }
        }

        // 3. Live Online Web Confirmation (DuckDuckGo HTML)
        let webResults = [];
        try {
          const searchQ = encodeURIComponent(`Akai MPC ${question}`);
          const ddgResp = await fetch(`https://html.duckduckgo.com/html/?q=${searchQ}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            signal: AbortSignal.timeout(4500)
          });
          const html = await ddgResp.text();
          const blocks = html.split('class="result__body"').slice(1, 5);
          for (const b of blocks) {
            const titleM = b.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
            const snipM = b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
            if (titleM) {
              let href = titleM[1].replace(/&amp;/g, '&');
              const uddg = href.match(/uddg=([^&]+)/);
              if (uddg) href = decodeURIComponent(uddg[1]);
              const clean = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
              webResults.push({
                title: clean(titleM[2]),
                snippet: snipM ? clean(snipM[1]) : '',
                url: href
              });
            }
          }
        } catch (_) {}

        // 4. Optional Gemini synthesis if API key present
        const apiKey = (payload.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();
        if (apiKey) {
          try {
            const contextStr = JSON.stringify({ kbMatch: bestKb, arsenalMatches: arsenalMatches.slice(0, 4), webResults });
            const prompt = `Tu es l'expert MPC One (OS 3.10.1) d'Arnaud Rigogne. Réponds EN FRANÇAIS, façon pas-à-pas débutant (Newbie) avec les boutons physiques exacts (MENU, MAIN, BROWSE, XL Channel Strip, Q-LINK, SAMPLE EDIT, PAD PERFORM). Question: "${question}". Contexte RAG + Web Live: ${contextStr}. Formate en HTML simple (<h4>, <p>, <ol>, <li>, <code>, <strong>).`;
            const gResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
            });
            const gData = await gResp.json();
            const gText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (gText) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, html: gText.replace(/^```html\s*/i, '').replace(/```$/, ''), webResults }));
              return;
            }
          } catch (_) {}
        }

        // 5. Structured on-topic response (RAG KB + Arsenal + Live Web Confirmation)
        let html = '';
        if (bestKb) {
          html += `<h4>🎯 ${bestKb.title}</h4><p>${bestKb.summary}</p>`;
          if (bestKb.steps?.length) {
            html += `<ol>${bestKb.steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
          }
          if (bestKb.tip) {
            html += `<div class="chat-newbie-box">💡 <strong>Astuce MPC One :</strong> ${bestKb.tip}</div>`;
          }
        } else if (arsenalMatches.length) {
          const m = arsenalMatches[0];
          html += `<h4>🎛️ ${m.name} (${m.vendor || 'inMusic'})</h4><p>${m.style || m.genre || ''} — Disponible sur ta MPC One via <code>MAIN → XL Channel Strip / Plugin</code>.</p>`;
        } else {
          html += `<h4>🔎 Recherche ciblée pour : « ${question.replace(/[<>&]/g, '')} »</h4>`;
        }

        if (webResults.length) {
          html += `<div style="margin-top:10px; padding:10px; border-radius:10px; background:rgba(0,229,255,0.06); border:1px solid rgba(0,229,255,0.22);">
            <strong>🌐 Confirmation & compléments en ligne :</strong>
            <ul style="margin-top:6px;">
              ${webResults.map(w => `<li><a href="${w.url}" target="_blank" style="color:var(--cyan);">${w.title}</a>${w.snippet ? ` — <span style="color:#cbd5e1;">${w.snippet}</span>` : ''}</li>`).join('')}
            </ul>
          </div>`;
        }

        html += `<div style="margin-top:8px; font-size:0.76rem; color:var(--text-muted);">
          📓 <a href="https://notebook.google.com/notebook/3e52a249-f8e4-4f72-bf57-377c8d245a9e" target="_blank" style="color:var(--cyan);">Interroger aussi directement tes 84 sources dans NotebookLM</a> (copie ta question dans le chat NotebookLM pour une synthèse multi-vidéos).
        </div>`;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, html, webResults }));
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

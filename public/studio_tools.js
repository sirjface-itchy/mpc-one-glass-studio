// =====================================================================
// MPC ONE STUDIO TOOLS (100% Client-Side ZIP, .XPJ GZIP, WAV & .XPM)
// =====================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function createZipBlob(entries) {
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : enc.encode(String(entry.data));
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034B50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8
    lv.setUint16(8, 0, true); // STORE
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014B50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    centralParts.push(central);
    offset += local.length + data.length;
  }

  let centralSize = 0;
  for (const c of centralParts) centralSize += c.length;
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054B50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

const FX_DESC_MAP = {
  'AIR Flavor': { version: 1, name: 'AIR Flavor', descriptiveName: 'AIR Flavor', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Flavor', uid: 1481655884, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Lo-Fi': { version: 1, name: 'AIR Lo-Fi', descriptiveName: 'AIR Lo-Fi', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Lo-Fi', uid: 1631996998, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'SP1200': { version: 1, name: 'SP1200', descriptiveName: 'SP1200', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'SP1200', uid: 1094940263, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Maximizer': { version: 1, name: 'AIR Maximizer', descriptiveName: 'AIR Maximizer', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Maximizer', uid: 1631997304, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'Bus Compressor': { version: 1, name: 'Bus Compressor', descriptiveName: 'Bus Compressor', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Bus Compressor', uid: 1094932042, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'Compressor Vintage': { version: 1, name: 'Compressor Vintage', descriptiveName: 'Compressor Vintage', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Compressor Vintage', uid: 1094932041, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Delay': { version: 1, name: 'AIR Delay', descriptiveName: 'AIR Delay', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Delay', uid: 1631994988, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Diff Delay': { version: 1, name: 'AIR Diff Delay', descriptiveName: 'AIR Diff Delay', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Diff Delay', uid: 1631994948, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Distortion': { version: 1, name: 'AIR Distortion', descriptiveName: 'AIR Distortion', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Distortion', uid: 1631994995, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Tube Drive': { version: 1, name: 'AIR Tube Drive', descriptiveName: 'AIR Tube Drive', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Tube Drive', uid: 1631999044, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'AIR Stutter': { version: 1, name: 'AIR Stutter', descriptiveName: 'AIR Stutter', pluginFormatName: 'MPC', category: '', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:AIR Stutter', uid: 1631998836, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'Mother Ducker': { version: 1, name: 'Mother Ducker', descriptiveName: 'Mother Ducker', pluginFormatName: 'MPC', category: 'Dynamics', manufacturerName: 'Akai Professional', fileOrIdentifier: 'MotherDuckerOutput', uid: 1094940244, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'Mother Ducker Input': { version: 1, name: 'Mother Ducker Input', descriptiveName: 'Mother Ducker Input', pluginFormatName: 'MPC', category: 'Dynamics', manufacturerName: 'Akai Professional', fileOrIdentifier: 'MotherDuckerInput', uid: 1094932052, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'PEQ 4-Band': { version: 1, name: 'PEQ 4-Band', descriptiveName: 'PEQ 4-Band', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'PEQ 4-Band', uid: 1094932070, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 },
  'Granulator': { version: 1, name: 'Granulator', descriptiveName: 'Granulator', pluginFormatName: 'MPC', category: '', manufacturerName: 'Akai Professional', fileOrIdentifier: 'Granulator', uid: 1229866834, isInstrument: false, numInputChannels: 2, numOutputChannels: 2 }
};

const INST_DESC_MAP = {
  'Sub Factory': { version: 1, name: 'Sub Factory', descriptiveName: 'Sub Factory', pluginFormatName: 'Qubiq', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'Qubiq:SubFactory', uid: 1397511238, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
  'Hype': { version: 1, name: 'Hype', descriptiveName: 'Hype', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:Hype', uid: 1399673721, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
  'Bassline': { version: 1, name: 'Bassline', descriptiveName: 'Bassline', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:Bassline', uid: 1114860654, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 },
  'TubeSynth': { version: 1, name: 'TubeSynth', descriptiveName: 'TubeSynth', pluginFormatName: 'MPC', category: 'Synth', manufacturerName: 'AIR Music Technology', fileOrIdentifier: 'MPC:TubeSynth', uid: 1415730041, isInstrument: true, numInputChannels: 0, numOutputChannels: 2 }
};

export async function generateTemplateClientSide(payload) {
  const resp = await fetch('./data/mpc_base_template.json.gz');
  if (!resp.ok) throw new Error('Base template .json.gz introuvable');
  const ds = new DecompressionStream('gzip');
  const decompressedStream = resp.body.pipeThrough(ds);
  const tplText = await new Response(decompressedStream).text();
  const tpl = JSON.parse(tplText);

  const safeName = (payload.projectName || 'MPC_One_Template').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'MPC_One_Template';
  const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const bpm = Math.max(40, Math.min(240, Number(payload.bpm) || 90));
  const bars = Math.max(1, Math.min(64, Number(payload.bars) || 4));
  const d = tpl.root.data;

  d.masterTempo = bpm;
  d.masterTempoEnabled = true;
  if (d.sequences?.[0]?.value) {
    d.sequences[0].value.name = `${safeName} - Main`;
    d.sequences[0].value.bpm = bpm;
    d.sequences[0].value.lengthBars = bars;
    d.sequences[0].value.loopStartBar = 0;
    d.sequences[0].value.loopEndBar = bars;
    d.sequences[0].value.loop = true;
  }

  const tracksConfig = payload.tracks || [];
  for (let i = 0; i < Math.min(4, tracksConfig.length); i++) {
    const cfg = tracksConfig[i];
    const tr = d.tracks[i];
    if (!tr) continue;
    if (cfg.name) {
      tr.name = cfg.name;
      tr.program.name = cfg.name;
    }
    if (cfg.instrument && INST_DESC_MAP[cfg.instrument] && tr.program.type === 3 && tr.program.plugin?.plugin) {
      tr.program.plugin.plugin.description = INST_DESC_MAP[cfg.instrument];
      tr.program.plugin.plugin.state = '';
      tr.program.plugin.plugin.presetName = 'Init';
    }
    if (Array.isArray(cfg.fx)) {
      const effects = [];
      cfg.fx.forEach((fxName, idx) => {
        if (FX_DESC_MAP[fxName]) {
          effects.push({
            index: idx,
            plugin: { version: 2, is64Bits: false, description: FX_DESC_MAP[fxName], state: '', programNumber: 0, presetName: 'Init', presetEdited: false },
            enable: true
          });
        }
      });
      tr.program.mixable.inserts = { insertsEnabled: true, effects };
    }
  }

  if (payload.includeGroove !== false && d.sequences?.[0]?.value) {
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
    const drumEvents = [], bassEvents = [];
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

  const xpjPlain = new TextEncoder().encode(tpl.header + JSON.stringify(tpl.root));
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(xpjPlain);
  writer.close();
  const xpjBytes = new Uint8Array(await new Response(cs.readable).arrayBuffer());

  const xpjFileName = `${safeName}.xpj`;
  const guideText = `MPC ONE STANDALONE TEMPLATE — ${safeName}\nTempo: ${bpm} BPM | Longueur: ${bars} mesures\n\nINSTALLATION SUR CARTE SD :\n1. Copie "${xpjFileName}" et le dossier "${safeName}_[ProjectData]" à la racine de ta Carte SD.\n2. Sur ta MPC One : appuie sur BROWSE -> Carte SD -> "${xpjFileName}" -> Load.\n\n${payload.guideText || ''}\n`;
  const zipBlob = createZipBlob([
    { name: xpjFileName, data: xpjBytes },
    { name: `${safeName}_[ProjectData]/.mpc_keep`, data: 'MPC ProjectData folder' },
    { name: `GUIDE_${slug}.txt`, data: guideText }
  ]);

  return {
    ok: true,
    fileName: xpjFileName,
    zipUrl: URL.createObjectURL(zipBlob),
    xpjUrl: URL.createObjectURL(new Blob([xpjBytes], { type: 'application/octet-stream' })),
    sizeBytes: xpjBytes.length,
    clientSide: true
  };
}

// =====================================================================
// TAB 6 : SAMPLE PREP (.WAV), KEYGROUP (.XPM), PAD PERFORM & SD INSPECTOR
// =====================================================================

function encodeWav16(channels, sampleRate) {
  const numCh = channels.length;
  const numFrames = channels[0].length;
  const bytesPerSample = 2;
  const dataSize = numFrames * numCh * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * numCh * bytesPerSample, true);
  v.setUint16(32, numCh * bytesPerSample, true);
  v.setUint16(34, 16, true);
  writeStr(36, 'data');
  v.setUint32(40, dataSize, true);

  let pos = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(pos, s < 0 ? s * 32768 : s * 32767, true);
      pos += 2;
    }
  }
  return new Uint8Array(buf);
}

function parseNoteFromFilename(name) {
  const m = name.match(/([A-G])([#b]?)(-?[0-8])/i);
  if (!m) return 60;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase()];
  const acc = m[2] === '#' ? 1 : (m[2].toLowerCase() === 'b' ? -1 : 0);
  const oct = parseInt(m[3], 10);
  // MPC convention: C3 = 60 -> (oct + 2) * 12
  return Math.max(0, Math.min(127, (oct + 2) * 12 + base + acc));
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

export function initStudioTab() {
  // 1. Sample Prep (.wav)
  let decodedAudio = null;
  let originalFileName = 'sample.wav';
  let audioCtx = null;

  const prepInput = document.getElementById('prepAudioInput');
  const prepInfo = document.getElementById('prepAudioInfo');
  const prepPlayBtn = document.getElementById('prepPlayBtn');
  const prepExportBtn = document.getElementById('prepExportBtn');

  function getProcessedChannels() {
    if (!decodedAudio) return null;
    const sr = 44100;
    const srcSr = decodedAudio.sampleRate;
    const numCh = Math.min(2, decodedAudio.numberOfChannels);
    const ratio = srcSr / sr;
    const outLen = Math.max(1, Math.floor(decodedAudio.length / ratio));
    let chs = [];
    for (let c = 0; c < numCh; c++) {
      const src = decodedAudio.getChannelData(c);
      const dst = new Float32Array(outLen);
      for (let i = 0; i < outLen; i++) {
        const idx = i * ratio;
        const i0 = Math.floor(idx);
        const i1 = Math.min(src.length - 1, i0 + 1);
        const f = idx - i0;
        dst[i] = src[i0] * (1 - f) + src[i1] * f;
      }
      chs.push(dst);
    }

    if (document.getElementById('prepTrimSilence')?.checked) {
      let start = 0, end = outLen - 1;
      const thresh = 0.005;
      while (start < end && Math.max(...chs.map(c => Math.abs(c[start]))) < thresh) start++;
      while (end > start && Math.max(...chs.map(c => Math.abs(c[end]))) < thresh) end--;
      if (end > start + 100) chs = chs.map(c => c.slice(start, end + 1));
    }

    if (document.getElementById('prepNormalize')?.checked) {
      let peak = 0;
      for (const c of chs) for (let i = 0; i < c.length; i++) peak = Math.max(peak, Math.abs(c[i]));
      if (peak > 0.0001) {
        const gain = Math.pow(10, -0.5 / 20) / peak;
        chs = chs.map(c => {
          const out = new Float32Array(c.length);
          for (let i = 0; i < c.length; i++) out[i] = c[i] * gain;
          return out;
        });
      }
    }
    return { channels: chs, sampleRate: sr };
  }

  prepInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    originalFileName = file.name.replace(/\.[^.]+$/, '') + '_MPC.wav';
    prepInfo.textContent = '⏳ Décodage et analyse audio en cours...';
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const arr = await file.arrayBuffer();
      decodedAudio = await audioCtx.decodeAudioData(arr);
      const dur = decodedAudio.duration.toFixed(2);
      const estBars4 = Math.round((240 / decodedAudio.duration) * 10) / 10;
      const bpmHint = (estBars4 >= 60 && estBars4 <= 180) ? ` • BPM estimé (si boucle 4 temps) ≈ ${estBars4}` : '';
      prepInfo.textContent = `✅ Prêt : ${file.name} (${dur}s, ${decodedAudio.sampleRate}Hz → 44100Hz, ${decodedAudio.numberOfChannels} ch)${bpmHint}`;
      prepPlayBtn.disabled = false;
      prepExportBtn.disabled = false;
    } catch (err) {
      prepInfo.textContent = `❌ Erreur de décodage : ${err.message}`;
    }
  });

  prepPlayBtn?.addEventListener('click', () => {
    const proc = getProcessedChannels();
    if (!proc) return;
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const buf = audioCtx.createBuffer(proc.channels.length, proc.channels[0].length, proc.sampleRate);
    proc.channels.forEach((c, idx) => buf.copyToChannel(c, idx));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start();
  });

  prepExportBtn?.addEventListener('click', () => {
    const proc = getProcessedChannels();
    if (!proc) return;
    const wavBytes = encodeWav16(proc.channels, proc.sampleRate);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([wavBytes], { type: 'audio/wav' }));
    a.download = originalFileName;
    a.click();
  });

  // 2. Keygroup (.xpm) Multi-Notes Generator
  let kgFiles = [];
  const kgInput = document.getElementById('kgFilesInput');
  const kgPreview = document.getElementById('kgZonesPreview');

  kgInput?.addEventListener('change', (e) => {
    kgFiles = Array.from(e.target.files || []).slice(0, 12).map(f => ({
      file: f,
      rootNote: parseNoteFromFilename(f.name)
    })).sort((a, b) => a.rootNote - b.rootNote);

    if (!kgFiles.length) return;
    kgPreview.innerHTML = kgFiles.map((item, idx) => {
      const low = idx === 0 ? 0 : Math.floor((kgFiles[idx - 1].rootNote + item.rootNote) / 2) + 1;
      const high = idx === kgFiles.length - 1 ? 127 : Math.floor((item.rootNote + kgFiles[idx + 1].rootNote) / 2);
      return `Zone ${idx + 1}: <code>${item.file.name}</code> (Root MIDI ${item.rootNote} → Notes ${low}..${high})`;
    }).join('<br/>');
  });

  document.getElementById('kgBuildZipBtn')?.addEventListener('click', async () => {
    if (!kgFiles.length) {
      kgPreview.textContent = '⚠️ Sélectionne au moins 1 fichier .wav d\'abord !';
      return;
    }
    const kgName = (document.getElementById('kgName')?.value || 'Arnaud_Custom_Keys').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Arnaud_Custom_Keys';
    const instrumentsXml = kgFiles.map((item, idx) => {
      const low = idx === 0 ? 0 : Math.floor((kgFiles[idx - 1].rootNote + item.rootNote) / 2) + 1;
      const high = idx === kgFiles.length - 1 ? 127 : Math.floor((item.rootNote + kgFiles[idx + 1].rootNote) / 2);
      const sampleBase = item.file.name.replace(/\.wav$/i, '');
      return `      <Instrument number="${idx + 1}">
        <LowNote>${low}</LowNote>
        <HighNote>${high}</HighNote>
        <IgnoreBaseNote>False</IgnoreBaseNote>
        <ZonePlay>1</ZonePlay>
        <Layers>
          <Layer number="1">
            <Active>True</Active>
            <Volume>1.000000</Volume>
            <Pan>0.500000</Pan>
            <SampleName>${escapeXml(sampleBase)}</SampleName>
            <RootNote>${item.rootNote}</RootNote>
            <KeyTrack>True</KeyTrack>
            <VelStart>0</VelStart>
            <VelEnd>127</VelEnd>
          </Layer>
        </Layers>
      </Instrument>`;
    }).join('\n');

    const xpmXml = `<?xml version="1.0" encoding="UTF-8"?>\n<MPCVObject>\n  <Version>\n    <File_Version>2.1</File_Version>\n    <Application>MPC-V</Application>\n    <Platform>Linux</Platform>\n  </Version>\n  <Program type="Keygroup">\n    <Name>${escapeXml(kgName)}</Name>\n    <KeygroupNumKeygroups>${kgFiles.length}</KeygroupNumKeygroups>\n    <Instruments>\n${instrumentsXml}\n    </Instruments>\n  </Program>\n</MPCVObject>\n`;

    const entries = [{ name: `${kgName}.xpm`, data: xpmXml }];
    for (const item of kgFiles) {
      entries.push({ name: item.file.name, data: new Uint8Array(await item.file.arrayBuffer()) });
    }
    const zipBlob = createZipBlob(entries);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `${kgName}-Keygroup-MPC.zip`;
    a.click();
    kgPreview.innerHTML += `<br/>✅ Pack <code>${kgName}-Keygroup-MPC.zip</code> téléchargé !`;
  });

  // 3. PAD PERFORM Visual Chord Assistant
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const CHORD_STYLES = {
    boombap: { scale: 'Natural Minor', pads: [1, 3, 6, 8, 9, 11], prog: ['Pad 1: i (m7)', 'Pad 6: VI (maj7)', 'Pad 4: iv (m7)', 'Pad 5: v (m7)'] },
    neosoul: { scale: 'Major', pads: [1, 2, 5, 6, 9, 10], prog: ['Pad 2: ii9', 'Pad 5: V13', 'Pad 1: Imaj9', 'Pad 6: vi9'] },
    trap: { scale: 'Phrygian', pads: [1, 2, 7, 8, 9], prog: ['Pad 1: i (Dark)', 'Pad 2: bII (Tension)', 'Pad 7: VII', 'Pad 1: i'] },
    house: { scale: 'Dorian', pads: [1, 4, 6, 7, 10], prog: ['Pad 6: vi7', 'Pad 4: IVmaj7', 'Pad 1: I', 'Pad 5: V'] }
  };

  function renderChordPads() {
    const root = document.getElementById('chordRootSel')?.value || 'C';
    const styleKey = document.getElementById('chordStyleSel')?.value || 'boombap';
    const st = CHORD_STYLES[styleKey];
    const grid = document.getElementById('chordPadsVisual');
    const stepsEl = document.getElementById('chordNewbieSteps');
    if (!grid || !stepsEl) return;

    const padOrder = [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4];
    const rootIdx = NOTES.indexOf(root);
    grid.innerHTML = padOrder.map(num => {
      const isActive = st.pads.includes(num);
      const noteName = NOTES[(rootIdx + (num - 1)) % 12];
      return `<div class="chord-pad ${isActive ? 'active' : ''}">PAD ${String(num).padStart(2, '0')}<strong>${noteName}</strong></div>`;
    }).join('');

    stepsEl.innerHTML = `<strong>📖 Sur ta MPC One (Pas-à-Pas) :</strong> Appuie sur le bouton physique <code>PAD PERFORM</code> → touche <strong>Type : Progressions / Chords</strong> → règle <strong>Root Note : ${root}</strong> → <strong>Scale : ${st.scale}</strong>. Enchaîne les pads rouges : <code>${st.prog.join(' → ')}</code>.`;
  }
  document.getElementById('chordRootSel')?.addEventListener('change', renderChordPads);
  document.getElementById('chordStyleSel')?.addEventListener('change', renderChordPads);
  renderChordPads();

  // 4. .xpj Project Inspector & SD Backup (local server)
  fetch('/api/drives')
    .then(r => r.json())
    .then(data => {
      const sel = document.getElementById('backupSourceDrive');
      if (sel && data.drives) {
        sel.innerHTML = data.drives.map(d => `<option value="${d.id}">${d.label}</option>`).join('');
      }
      const stemSel = document.getElementById('stemTargetDrive');
      if (stemSel && data.drives) {
        stemSel.innerHTML = data.drives.map(d => `<option value="${d.id}">${d.label}</option>`).join('');
      }
    })
    .catch(() => {
      const sel = document.getElementById('backupSourceDrive');
      if (sel) sel.innerHTML = '<option value="">Serveur local requis (localhost:3030)</option>';
      const stemSel = document.getElementById('stemTargetDrive');
      if (stemSel) stemSel.innerHTML = '<option value="">Serveur local requis (localhost:3030)</option>';
    });

  document.getElementById('scanProjectsBtn')?.addEventListener('click', async () => {
    const box = document.getElementById('projectsListBox');
    box.textContent = '⏳ Scan de tes projets .xpj en cours...';
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Serveur local requis');
      const data = await res.json();
      if (!data.projects?.length) {
        box.textContent = 'Aucun projet .xpj trouvé sur les disques connectés.';
        return;
      }
      box.innerHTML = data.projects.map(p => `
        <div class="project-row">
          <div>
            <strong>${p.name}</strong> <span style="color:var(--cyan); font-family:var(--font-mono);">${p.bpm ? p.bpm + ' BPM' : ''}</span>
            <div style="font-size:0.7rem; color:var(--text-muted);">${p.trackCount} pistes • ${p.sizeKB} KB • ${p.hasProjectData ? '✅ ProjectData' : '⚠️ Sans ProjectData'}</div>
            ${p.plugins.length ? `<div style="font-size:0.68rem; color:#cbd5e1; margin-top:2px;">Plugins : ${p.plugins.slice(0, 6).join(', ')}</div>` : ''}
          </div>
          <span class="template-bpm-pill">${p.modified}</span>
        </div>
      `).join('');
    } catch (_) {
      box.innerHTML = '🖥️ <strong>Mode Public GitHub Pages :</strong> lance <code>node server.mjs</code> sur ton Mac (<code>http://localhost:3030</code>) pour scanner ton disque <code>SD MPC ONE SAVE</code>.';
    }
  });

  document.getElementById('runBackupSdBtn')?.addEventListener('click', async () => {
    const status = document.getElementById('sdBackupStatus');
    const sourceDriveId = document.getElementById('backupSourceDrive')?.value;
    if (!sourceDriveId) return;
    status.textContent = '⏳ Sauvegarde incrémentale en cours...';
    try {
      const res = await fetch('/api/backup-sd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDriveId })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      status.textContent = `✅ Sauvegarde terminée vers ${data.destRoot} : ${data.copiedFiles} élément(s) copié(s), ${data.skippedFiles} déjà à jour.`;
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
    }
  });

  // 5. AI Stem Separator (Demucs 4-Stems via local Mac server)
  document.getElementById('stemSeparateBtn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('stemAudioInput');
    const resBox = document.getElementById('stemResultBox');
    const btn = document.getElementById('stemSeparateBtn');
    const file = fileInput?.files?.[0];
    if (!file) {
      resBox.style.display = 'block';
      resBox.className = 'sdk-compile-result error';
      resBox.textContent = '⚠️ Choisis d\'abord un fichier audio (.wav, .mp3, .m4a).';
      return;
    }

    btn.disabled = true;
    const origLabel = btn.innerHTML;
    btn.innerHTML = '⏳ Séparation IA Demucs en cours (Drums, Bass, Vocals, Other)...';
    resBox.style.display = 'block';
    resBox.className = 'sdk-compile-result';
    resBox.innerHTML = '⏳ Conversion en WAV 44.1 kHz + séparation IA Demucs sur ton Mac...';

    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const arr = await file.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(arr);
      const ch0 = decoded.getChannelData(0);
      const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : ch0;
      const wavBytes = encodeWav16([ch0, ch1], decoded.sampleRate);

      // Convert Uint8Array to base64 safely in chunks
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < wavBytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, wavBytes.subarray(i, i + chunk));
      }
      const wavBase64 = btoa(bin);

      const resp = await fetch('/api/separate-stems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          wavBase64,
          copyToDrive: document.getElementById('stemCopyToDrive')?.checked,
          targetDriveId: document.getElementById('stemTargetDrive')?.value || 'workspace'
        })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Erreur de séparation');

      const icons = { drums: '🥁 Drums', bass: '🔊 Bass', vocals: '🎤 Vocals', other: '🎹 Other (Mélo)' };
      resBox.innerHTML = `
        <strong>✅ 4 Stems séparés avec succès !</strong>
        ${data.deployedDir ? `<div style="margin-top:4px; font-size:0.78rem;">💾 Copiés dans : <code>${data.deployedDir}</code></div>` : ''}
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px; margin-top:10px;">
          ${data.stems.map(s => `
            <div style="background:rgba(11,14,22,0.75); border:1px solid var(--border-glass); border-radius:10px; padding:8px;">
              <div style="font-size:0.78rem; font-weight:700; margin-bottom:4px;">${icons[s.name] || s.name}</div>
              <audio controls src="${s.url}" style="width:100%; height:30px;"></audio>
              <a href="${s.url}" download="${data.slug}_${s.name}.wav" style="font-size:0.72rem; color:var(--cyan);">⬇️ Télécharger ${s.name}.wav</a>
            </div>
          `).join('')}
        </div>
        <div class="sdk-result-actions" style="margin-top:10px;">
          <a class="btn-download-zip" href="${data.zipUrl}" download>📦 Télécharger les 4 Stems (.zip)</a>
        </div>
      `;
    } catch (err) {
      resBox.className = 'sdk-compile-result error';
      resBox.innerHTML = `❌ ${err.message} (Note : le séparateur IA tourne sur le serveur local Mac <code>node server.mjs</code>).`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = origLabel;
    }
  });
}

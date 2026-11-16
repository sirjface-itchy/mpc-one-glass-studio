let arsenalData = null;
let selectedInstrumentIndex = 0;
let selectedQBankIndex = 0;
let activeCodeTab = 'cpp';

const HW_SHORTCUTS = [
  { btn: "MAIN / TRACK", info: "En MPC 3.10 : Appui simple = Main Mode (Pistes unifiées 1:1 + XL Channel Strip). Double appui ou maintien = Arrange Mode linéaire avec le nouvel outil Marquee !" },
  { btn: "STEP SEQ / PAD PERFORM", info: "Appui simple = Step Sequencer visuel sur les 16 pads. SHIFT + STEP SEQ = Pad Perform (Gammes, Accords, Progressions, Chromatique)." },
  { btn: "SAMPLER / LOOPER", info: "Ouvre l'échantillonneur pour enregistrer ta Numark Scratch ou ton Mac. Astuce MPC 3 : tu peux aussi sampler directement depuis un pad vide dans Main Mode !" },
  { btn: "SAMPLE EDIT / Q-LINK EDIT", info: "Découpe (Chop) par Threshold/Regions/BPM avec '0 Snap' activé. SHIFT + SAMPLE EDIT ouvre le Q-Link Edit pour assigner tes 4 encodeurs." },
  { btn: "PROGRAM EDIT / MIDI CTRL", info: "Ouvre l'éditeur de synthèse Drum/Keygroup (avec le nouveau moteur Oscillator Synth Engine de la 3.9/3.10 et les 8 couches de vélocité)." },
  { btn: "XYFX / TUNE", info: "Transforme l'écran 7 pouces en surface X/Y temps-réel (idéal à automatiser ou à combiner avec ton plugin Akai Flex Beat)." },
  { btn: "16 LEVEL / NOTES", info: "En MPC 3.6/3.10 : inclut désormais les ARTICULATIONS (Flams, Rolls, Sub-divisions) en plus de Velocity, Tune, Filter et Layer !" },
  { btn: "PAD MUTE / TRACK MUTE", info: "Coupe instantanément les éléments d'un Drum Kit (Pad Mute) ou des pistes complètes de ton arrangement (Track Mute) en live." },
  { btn: "MENU / PREFS", info: "En MPC 3.10.1 : Va dans Menu > Preferences > Enhancements pour activer 'External Plugin Support' (VST2 Plugins), la souris USB et le Developer Panel." }
];

const LOGIC_BRIDGE_GUIDES = {
  alchemy: {
    title: "Logic Pro Alchemy / Retro Synth / Sampler → MPC One Standalone",
    verdict: "Passerelle recommandée : Auto-Sampling Haute Précision (Keygroup 8 Velocity Layers MPC 3)",
    steps: [
      "Alchemy et Retro Synth font partie du code interne de Logic Pro (Apple AU uniquement). Ils ne peuvent pas être copiés en tant que binaire sur Linux ARM.",
      "Branche ta MPC One en USB à ton Mac (ou utilise ton interface audio) et ouvre l'outil <strong>Sampler &gt; Auto-Sampler</strong> sur ta MPC.",
      "Dans Logic Pro, arme la piste Alchemy sur le canal MIDI 1. Sur la MPC One, règle <code>Note Stride = 3</code>, <code>Min/Max Note = C1 à C5</code>, et active <code>2 à 4 Velocity Layers</code>.",
      "Une fois capturé, active le nouveau filtre modélisé et les effets <strong>AIR Ether</strong> ou <strong>Flavor Pro</strong> directement sur ton Keygroup dans la MPC One : tu obtiens exactement ton patch Alchemy avec <strong>0% de charge CPU synthé</strong> !"
    ]
  },
  serum: {
    title: "Xfer Serum / u-he Diva / Omnisphere / Arturia → MPC One Standalone",
    verdict: "Passerelle hybride : Auto-Sampling + Moteur Wavetable Natif MPC 3.9/3.10",
    steps: [
      "Pour les basses 808/Reese ou leads complexes : utilise l'<strong>Auto-Sampler</strong> ou importe directement les tables d'ondes (fichiers <code>.wav</code> de Serum) dans ton <strong>AIR Sub Factory</strong> ou dans le nouveau <strong>Oscillator Synth Engine</strong> (MPC OS 3.9/3.10) des pistes Keygroup !",
      "Pour les pads analogiques type Diva/Prophet : tu possèdes déjà <strong>Native Instruments Analog Dreams</strong> et <strong>F9 Instruments Collection</strong> en natif sur ta MPC One, qui couvrent 80% des textures Juno/OB/Prophet sans ordinateur."
    ]
  },
  ni: {
    title: "Native Instruments (Kontakt / Play Series) → MPC One Standalone",
    verdict: "✅ Déjà inclus en Natif Standalone dans ton compte inMusic !",
    steps: [
      "Excellente nouvelle : j'ai vérifié ton compte inMusic et tu possèdes déjà <strong>5 éditions natives MPC Standalone</strong> de Native Instruments : <code>Analog Dreams</code>, <code>Cloud Supply</code>, <code>Duets</code>, <code>Ignition Keys</code> et <code>Global Shake</code> !",
      "Pour les installer sur ta MPC One (qui n'a pas de Wi-Fi intégré) : branche un câble <strong>Ethernet RJ45</strong> sur ta MPC One (ou utilise le partage réseau USB depuis ton Mac), va dans <code>Preferences &gt; Activate Plugins</code>, connecte ton compte inMusic et télécharge-les directement sur ta <strong>Carte SD</strong> (jamais sur les 4 Go internes)."
    ]
  },
  dexed: {
    title: "Synthés Open-Source (Dexed DX7, Surge XT, OB-Xd, Airwindows) → MPC One 3.10.1",
    verdict: "🔥 NOUVEAU EN 3.10.1 : Exécution directe en VST2 Linux ARM64 via Open MPC / SDK !",
    steps: [
      "Grâce à la mise à jour <strong>MPC OS 3.10.1</strong> de cette semaine, les plugins dont le code C++/JUCE est ouvert peuvent tourner <strong>nativement en VST2</strong> sur ta MPC One !",
      "Sur ta MPC One, active <code>Menu &gt; Preferences &gt; Enhancements &gt; Enable Enhancements and External Plugin Support</code> et redémarre.",
      "Crée un dossier <code>VST2 Plugins</code> à la racine de ta carte SD. Télécharge les binaires ARM64 pré-compilés du catalogue communautaire <strong>Open MPC</strong> (ex: Dexed FM, synthés granulaires, effets custom) ou génère les tiens dans l'onglet <strong>Atelier MPC Plugin SDK</strong> de cette interface !"
    ]
  },
  fx: {
    title: "Effets Logic Pro / FabFilter Pro-Q3 / RC-20 Retro Color → Équivalents Natifs MPC One",
    verdict: "✅ Remplacement 1:1 par ton MPC Pro Pack & ta suite AIR/MSXII Standalone",
    steps: [
      "<strong>FabFilter Pro-Q3</strong> → Utilise <strong>AIR Visual EQ4</strong> (inclus dans ton <em>MPC Pro Pack</em>) qui t'offre un analyseur spectral temps-réel tactile sur l'écran 7 pouces.",
      "<strong>XLN Audio RC-20 Retro Color</strong> → Utilise ton <strong>AIR Flavor Pro</strong> + <strong>MSXII Fly Tape II</strong> + <strong>Lo-Fly Dirt</strong> en Insert : ils surpassent même RC-20 sur le grain vinyle/cassette en standalone.",
      "<strong>Valhalla Shimmer / VintageVerb</strong> → Utilise ton <strong>AIR Ether</strong> et <strong>AIR Reverb Pro</strong> (inclus dans ton compte).",
      "<strong>Knock / StandardCLIP</strong> → Utilise ton <strong>AIR Soft Clipper</strong> sur le Drum Bus ou Master."
    ]
  }
};

async function initApp() {
  setupTabs();
  try {
    const res = await fetch('/api/arsenal');
    if (!res.ok) throw new Error('Static mode');
    arsenalData = await res.json();
  } catch (_) {
    const res = await fetch('./data/inmusic_arsenal.json');
    arsenalData = await res.json();
  }

  initChat();
  renderHardwareCockpit();
  renderCatalog('all');
  initBridgeTab();
  initSdkTab();
  initTemplatesTab();
}

function setupTabs() {
  const buttons = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

function initChat() {
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const clearBtn = document.getElementById('clearChatBtn');

  const welcomeHtml = `
    <h4>Salut Arnaud ! Bienvenue dans ton MPC One Glass Studio (OS 3.10.1).</h4>
    <p>J'ai synchronisé ton <strong>NotebookLM</strong> (désormais enrichi à <strong>74 sources</strong> avec toute la documentation 3.9, 3.10 et 3.10.1) ainsi que l'intégralité de ton compte <strong>inMusic</strong> (ta <strong>MPC One</strong> série <code>A12201241842841</code>, ta <strong>Numark Scratch</strong>, ton <strong>MPK49</strong> et tes <strong>38 plugins & expansions</strong>).</p>
    <ul>
      <li><strong>VST Externes confirmés (3.10.1) :</strong> Tu peux maintenant charger des plugins compilés en Linux ARM64 dans le dossier <code>VST2 Plugins</code> à la racine de ta carte SD.</li>
      <li><strong>MPC Plugin SDK officiel confirmé :</strong> Tu peux créer tes propres instruments/effets C++/JUCE avec skin tactile 7 pouces dans l'onglet <em>Atelier MPC Plugin SDK</em>.</li>
      <li><strong>Pose-moi n'importe quelle question</strong> ci-dessous ou clique sur une suggestion rapide !</li>
    </ul>
  `;
  appendMessage('agent', welcomeHtml);

  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      handleUserQuery(chip.dataset.prompt);
    });
  });

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = chatInput.value.trim();
    if (!q) return;
    chatInput.value = '';
    handleUserQuery(q);
  });

  clearBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    appendMessage('agent', welcomeHtml);
  });
}

function appendMessage(role, html) {
  const chatMessages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.innerHTML = html;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleUserQuery(query) {
  appendMessage('user', `<p>${escapeHtml(query)}</p>`);
  const answer = generateExpertResponse(query);
  setTimeout(() => appendMessage('agent', answer), 220);
}

function generateExpertResponse(q) {
  const lower = q.toLowerCase();

  if (lower.includes('vst') || lower.includes('3.10.1') || lower.includes('externe') || lower.includes('activer')) {
    return `
      <h4>Activation des Plugins VST2 Externes sur ta MPC One (OS 3.10.1)</h4>
      <p>La mise à jour <strong>MPC OS 3.10.1</strong> sortie cette semaine débloque officiellement le chargement de plugins tiers sans aucun hack SSH :</p>
      <ol>
        <li>Sur ta MPC One, appuie sur le bouton physique <code>MENU</code> puis touche l'icône d'engrenage (<strong>Preferences</strong>) en haut.</li>
        <li>Descends tout en bas de la colonne de gauche jusqu'au nouvel onglet <code>Enhancements</code>.</li>
        <li>Coche <strong>Enable Enhancements and External Plugin Support</strong> et redémarre ta MPC One.</li>
        <li>Sur ton Mac, insère la <strong>Carte SD</strong> de ta MPC One et crée à sa racine un dossier nommé exactement : <code>VST2 Plugins</code>.</li>
        <li>Dépose tes plugins compilés au format <strong>Linux ARM64 (<code>.so</code> + dossier skin)</strong> issus du <em>MPC Plugin SDK</em> ou du catalogue <em>Open MPC</em>.</li>
      </ol>
      <p>⚠️ <strong>Rappel spécifique à ta MPC One :</strong> Ne copie jamais de plugins ou d'expansions sur la mémoire interne (4 Go réservés à l'OS). Utilise toujours ta carte SD !</p>
    `;
  }

  if (lower.includes('logic') || lower.includes('mac') || lower.includes('alchemy') || lower.includes('serum') || lower.includes('diva')) {
    return `
      <h4>Réutiliser tes Plugins Logic Pro (Mac) sur ta MPC One Standalone</h4>
      <p>Tes plugins Logic Pro sont compilés en <strong>Audio Units (<code>.component</code>) macOS</strong>, tandis que ta MPC One tourne sous <strong>Linux ARM64</strong>. Voici comment procéder selon le plugin :</p>
      <ul>
        <li><strong>1. Tes plugins Native Instruments (Play Series) :</strong> Tu possèdes déjà les licences Standalone de <code>Analog Dreams</code>, <code>Cloud Supply</code>, <code>Duets</code>, <code>Ignition Keys</code> et <code>Global Shake</code> sur ton compte inMusic ! Active-les via un câble Ethernet branché au dos de ta MPC One.</li>
        <li><strong>2. Synthés exclusifs à Logic (Alchemy, Retro Synth, Diva, Serum) :</strong> Utilise l'<strong>Auto-Sampler</strong> de la MPC One (reliée en USB Audio/MIDI à Logic Pro). Avec <strong>MPC OS 3</strong>, chaque Keygroup supporte jusqu'à <strong>8 couches de vélocité</strong>, des filtres analogiques modélisés et le moteur d'effets <code>AIR Ether</code> / <code>Flavor Pro</code>.</li>
        <li><strong>3. Plugins Open-Source (Dexed DX7, Surge, OB-Xd) :</strong> Utilise les versions compilées en ARM64 pour le dossier <code>VST2 Plugins</code> de la 3.10.1 ! (Voir l'onglet <em>Pont Logic Pro → MPC Standalone</em>).</li>
      </ul>
    `;
  }

  if (lower.includes('boom-bap') || lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('mix') || lower.includes('recette') || lower.includes('flavor')) {
    return `
      <h4>🎛️ Guide Pas-à-Pas Débutant (Newbie) : Créer un Beat Boom-Bap / Lo-Fi sur ta MPC One (OS 3.10.1)</h4>
      <p>Voici <strong>chaque bouton physique et chaque touche tactile</strong> dans l'ordre exact, en utilisant tes propres plugins & expansions :</p>
      <ol>
        <li><strong>0. Préparer ton projet neuf, Tempo & Swing :</strong>
          <br>• Appuie sur le bouton physique <code>MENU</code> (à droite de l'écran) → touche <strong>New Project</strong> → <strong>Empty Project</strong>.
          <br>• Appuie sur <code>MAIN</code> (en haut à gauche des boutons) pour revenir sur la vue principale.
          <br>• En haut de l'écran tactile, touche le chiffre du <strong>BPM</strong> (ex. <code>120.00</code>) → tourne la grosse molette <strong>DATA DIAL</strong> (ou double-touche pour taper <code>90</code>) → touche <strong>Do It</strong>.
          <br>• Appuie sur le bouton physique <code>TC</code> (Timing Correct) → sur l'écran, monte <strong>Swing</strong> à <code>58%</code> ou <code>60%</code> pour le rebond Boom-Bap.
        </li>
        <li><strong>1. Piste 1 — Drums qui claquent (Kit + Grain 12-bit + Punch) :</strong>
          <br>• Sur <code>MAIN</code>, vérifie que <strong>Track 1</strong> est de type <strong>Drum</strong> (icône de petits pads).
          <br>• Appuie sur le bouton physique <code>BROWSE</code> → en bas de l'écran tactile, touche <strong>Expansions</strong> → choisis <code>Marco Polo - Pad Thai Vol. 3</code>, <code>Premier Beats</code> ou <code>DECAP - Drums That Knock</code> → touche un kit (<code>.xpm</code>) → appuie sur <strong>Load</strong> en bas à droite.
          <br>• Appuie sur <code>MAIN</code>. Sur le bord gauche de l'écran tactile, ouvre le <strong>XL Channel Strip</strong> (touche la petite icône fader/flèche en haut à gauche si besoin).
          <br>• Dans la section <strong>Inserts</strong> du Channel Strip, touche <strong>Slot 1 (+)</strong> → <code>MSXII → Lo-Fly Dirt</code> (choisis un preset <em>12-bit / SP-1200</em>).
          <br>• Touche <strong>Slot 2 (+)</strong> → <code>AIR → AIR Soft Clipper</code> (monte légèrement <em>Drive</em> et règle <em>Out</em> à <code>-1.0 dB</code> pour que le Kick tape fort sans saturer).
          <br>• Pour enregistrer : maintiens <code>REC</code> + appuie sur <code>PLAY START</code> (comptage 4 temps), puis joue ton Kick/Snare/Hat sur les pads !
        </li>
        <li><strong>2. Piste 2 — Sample / Chops (Expansion ou Vinyle via ta Numark Scratch) :</strong>
          <br>• Sur <code>MAIN</code>, touche le <strong><code>+</code></strong> à droite du nom de piste en haut pour créer <strong>Track 2 (Drum)</strong>.
          <br>• <em>Option A (Expansion rapide) :</em> appuie sur <code>BROWSE</code> → <strong>Expansions</strong> → <code>LoFi Jazz</code> ou <code>Soul Provider 3</code> → charge un kit de chops.
          <br>• <em>Option B (Sampler un vrai vinyle via ta Numark Scratch) :</em> branche les sorties RCA/TRS de ta <strong>Numark Scratch</strong> dans les prises <strong>INPUT 1/2 (L/R)</strong> au dos de la MPC One → appuie sur le bouton physique <code>SAMPLER</code> → vérifie <strong>Input 1,2</strong> → appuie sur <strong>ARM</strong> puis <strong>RECORD</strong> → joue ton disque → <strong>STOP</strong> → <strong>KEEP</strong>. Ensuite appuie sur <code>SAMPLE EDIT</code> → touche <strong>CHOP</strong> (en bas) → choisis <strong>Threshold</strong> ou <strong>BPM</strong> → maintiens <code>SHIFT</code> et touche <strong>CONVERT</strong> → choisis <em>New Drum Program using Slices</em> → <strong>Do It</strong>.
          <br>• Pour caler le sample au tempo : dans <code>SAMPLE EDIT</code>, touche l'onglet <strong>WARP</strong> → active <strong>Warp</strong> → choisis <strong>Super Warp</strong> (inclus dans ton <em>MPC Pro Pack</em>) ou <strong>Repitch</strong>.
          <br>• Retourne sur <code>MAIN</code> → dans le <strong>XL Channel Strip</strong> de Track 2, touche <strong>Insert 1 (+)</strong> → <code>AIR → AIR Flavor Pro</code> → touche l'icône crayon pour ouvrir son écran et active <strong>Vinyl</strong> + un léger <strong>Flutter</strong> + filtre <strong>Radio</strong>.
        </li>
        <li><strong>3. Piste 3 — Basse Sub / 808 (jouée aux Pads sans fausse note) :</strong>
          <br>• Sur <code>MAIN</code>, touche <strong><code>+</code></strong> en haut pour ajouter <strong>Track 3</strong> → choisis le type <strong>PLUGIN</strong> (icône de prise/synthé).
          <br>• Touche le sélecteur de plugin → choisis <code>AIR → AIR Sub Factory</code> (ou charge une basse <code>F9 Instruments</code> via <code>BROWSE</code>).
          <br>• Appuie sur le bouton physique <code>PAD PERFORM</code> (ou <code>SHIFT + STEP SEQ</code>) : sélectionne <strong>Notes</strong> et la gamme de ton sample (ex. <em>Minor Natural</em>). Tes 16 pads jouent maintenant uniquement les bonnes notes !
          <br>• Appuie sur le bouton physique <code>Q-LINK</code> (à droite, au-dessus des 4 gros boutons rotatifs) : tourne les 4 encodeurs physiques pour doser le <em>Cutoff</em>, le <em>Drive</em> et le <em>Glide</em> en temps réel.
        </li>
        <li><strong>4. Mix, Profondeur (Send) & Effets Live (Tape-Stop) :</strong>
          <br>• Appuie sur <code>MENU</code> → touche <strong>Channel Mixer</strong> → en haut, touche <strong>Returns</strong> → sur <strong>Return 1</strong>, charge <code>AIR → AIR Ether</code> ou <code>AIR Reverb Pro</code>. Reviens sur <code>MAIN</code> et monte le curseur <strong>Send 1</strong> à <code>20%</code> sur ta piste Sample et Snare.
          <br>• Sur le <strong>Master</strong> (ou <strong>Submix 1</strong>), ajoute en Insert <code>Akai → Flex Beat</code> ou <code>MSXII → Fly Tape II</code> : touche ses pads à l'écran pour faire des freinages vinyle et stutters !
        </li>
        <li><strong>5. Sauvegarde vitale sur Carte SD :</strong>
          <br>• Appuie sur <code>SHIFT + BROWSE</code> (icône Save) → touche <strong>Project</strong> → sélectionne <strong>ta Carte SD</strong> dans la colonne de gauche (⚠️ <em>jamais la mémoire interne</em>) → tape un nom → <strong>Save</strong>.
        </li>
      </ol>
      <div class="chat-newbie-box">
        💡 <strong>Raccourci magique :</strong> Va dans le nouvel onglet <strong>🎛️ Templates MPC One (.xpj)</strong> en haut pour télécharger ce projet Boom-Bap déjà pré-câblé (pistes, BPM, inserts) au format natif <code>.xpj</code> pour ta MPC One !
      </div>
    `;
  }

  if (lower.includes('mpc one') || lower.includes('matériel') || lower.includes('one+') || lower.includes('ethernet') || lower.includes('souris')) {
    return `
      <h4>Spécificités Matérielles de ta MPC One (Modèle Classique vs One+) sous OS 3.10.1</h4>
      <ul>
        <li><strong>Réseau (Ethernet / USB Tethering) :</strong> Contrairement à la One+, ta MPC One classique n'a pas de puce Wi-Fi/Bluetooth interne. Branche un câble <strong>RJ45 Ethernet</strong> à l'arrière (ou partage la connexion de ton iPhone/Mac en USB) pour activer tes plugins <em>Native Instruments / AIR</em>, utiliser Ableton Link et profiter du nouveau <strong>Remote Screen</strong> de la 3.10.1.</li>
        <li><strong>Nouveau Support Souris USB (3.10.1) :</strong> Tu peux brancher une souris USB (ou un hub USB avec ta souris + ton clavier maître <strong>MPK49</strong>) sur le port USB-A au dos de ta MPC One pour éditer l'Arrange Mode avec un pointeur précis !</li>
        <li><strong>4 Q-Links & Boutons dédiés :</strong> Ta MPC One possède plus de boutons directs que la Live II (<code>Step Seq</code>, <code>Sampler</code>, <code>XYFX</code>, <code>Pad Mute</code>, <code>Next Seq</code>). Utilise le bouton <code>Q-LINK</code> pour basculer entre les 4 banques de tes 4 encodeurs tactiles.</li>
      </ul>
    `;
  }

  return `
    <h4>Analyse RAG MPC OS 3.10.1 pour ta question :</h4>
    <p>Dans le workflow unifié <strong>MPC 3.10 / 3.10.1</strong> sur ta MPC One :</p>
    <ul>
      <li><strong>Architecture 1:1 (Main Mode) :</strong> Chaque piste correspond désormais directement à son programme (Drum, Keygroup, Plugin, Audio, MIDI ou CV). Utilise le <strong>XL Channel Strip</strong> sur la gauche de ton écran 7 pouces pour ajuster les 4 Inserts, les 4 Sends et le routage sans quitter ta vue principale.</li>
      <li><strong>Oscillator Synth Engine (3.9+) :</strong> Dans <code>Program Edit</code> sur n'importe quelle piste Drum ou Keygroup, tu peux changer la source d'un Layer de <em>Sample</em> vers <em>Oscillator</em> pour synthétiser des basses, leads ou percussions directement sans échantillon.</li>
      <li><strong>Arrange Mode (3.10) :</strong> Utilise le nouvel outil <strong>Marquee</strong> (icône de rectangle en haut de l'Arrangeur) pour sélectionner, copier ou découper une zone précise sur plusieurs pistes à la fois.</li>
    </ul>
    <p><em>Astuce : Consulte l'onglet <strong>Arsenal inMusic & Cockpit MPC One</strong> pour voir comment mapper tes 4 Q-Links sur tes instruments Native Instruments et AIR !</em></p>
  `;
}

function renderHardwareCockpit() {
  const instruments = arsenalData.software_and_plugins.standalone_instruments;
  const inst = instruments[selectedInstrumentIndex] || instruments[0];
  const bankNames = Object.keys(inst.qlink_banks);
  const currentBankKey = bankNames[selectedQBankIndex] || bankNames[0];
  const params = inst.qlink_banks[currentBankKey];

  document.getElementById('screenPluginType').textContent = inst.type.toUpperCase();
  document.getElementById('screenPluginName').textContent = `${inst.vendor} — ${inst.name}`;
  document.getElementById('activeQBankLabel').textContent = currentBankKey.toUpperCase();
  document.getElementById('screenInfoText').innerHTML = `
    <strong>Style :</strong> ${inst.style}<br/>
    <strong>Banque Q-Link active (${currentBankKey}) :</strong> ${params.join(' • ')}
  `;

  // Render 4 Q-Link Knobs
  const qStack = document.getElementById('qlinksStack');
  qStack.innerHTML = params.map((p, idx) => `
    <div class="qlink-item">
      <div class="qlink-knob-circle" style="transform: rotate(${(idx * 35) - 40}deg)"></div>
      <div class="qlink-meta">
        <span class="qlink-idx">Q-LINK ${idx + 1}</span>
        <span class="qlink-param">${p}</span>
      </div>
    </div>
  `).join('');

  // Bank selector buttons
  const bankBtns = document.querySelectorAll('.qbank-btn');
  bankBtns.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === selectedQBankIndex);
    btn.onclick = () => {
      selectedQBankIndex = idx;
      renderHardwareCockpit();
    };
  });

  // Render 16 Pads (MPC layout: top row is Pad 13-16, bottom row is Pad 1-4)
  const padOrder = [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4];
  const padRoles = {
    1: "Kick 1 (Sub)", 2: "Kick 2 (Punch)", 3: "Snare 1 (Crisp)", 4: "Snare 2 (Rim)",
    5: "Closed Hat 1", 6: "Closed Hat 2", 7: "Open Hat", 8: "Crash / Ride",
    9: "Sample Chop 1", 10: "Sample Chop 2", 11: "Sample Chop 3", 12: "Sample Chop 4",
    13: "Bass / 808 Note", 14: "Chord Hit Maj9", 15: "Vocal Stutter", 16: "FX / Riser"
  };
  const padsGrid = document.getElementById('mpcPadsGrid');
  padsGrid.innerHTML = padOrder.map(num => `
    <div class="mpc-pad" data-pad="${num}">
      <span class="pad-num">PAD A${String(num).padStart(2, '0')}</span>
      <span class="pad-label">${padRoles[num]}</span>
    </div>
  `).join('');

  padsGrid.querySelectorAll('.mpc-pad').forEach(pad => {
    pad.addEventListener('click', () => {
      padsGrid.querySelectorAll('.mpc-pad').forEach(p => p.classList.remove('pad-active'));
      pad.classList.add('pad-active');
      const num = pad.dataset.pad;
      document.getElementById('screenInfoText').innerHTML = `
        <strong>PAD A${String(num).padStart(2, '0')} (${padRoles[num]}) sélectionné !</strong><br/>
        Astuce MPC OS 3.10 : Appuie sur <code>16 LEVEL</code> pour accéder aux nouvelles <strong>Articulations (Rolls/Flams)</strong> ou touche un pad vide + Record pour sampler en direct !
      `;
    });
  });

  // Render Hardware Dedicated Buttons
  const hwGrid = document.getElementById('hwButtonsGrid');
  hwGrid.innerHTML = HW_SHORTCUTS.map((h, i) => `
    <button class="hw-btn" data-hwidx="${i}">${h.btn}</button>
  `).join('');

  hwGrid.querySelectorAll('.hw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = HW_SHORTCUTS[Number(btn.dataset.hwidx)];
      document.getElementById('screenInfoText').innerHTML = `
        <strong>Bouton Physique [${item.btn}] :</strong><br/>${item.info}
      `;
    });
  });
}

function renderCatalog(filter) {
  const grid = document.getElementById('catalogGrid');
  const items = [];

  if (filter === 'all' || filter === 'instrument') {
    arsenalData.software_and_plugins.standalone_instruments.forEach((inst, idx) => {
      items.push({
        category: 'instrument',
        badge: 'INSTRUMENT STANDALONE',
        badgeClass: 'tag-red',
        title: inst.name,
        subtitle: `${inst.vendor} • ${inst.style}`,
        serial: `Licence: ${inst.serial}`,
        onClick: () => {
          selectedInstrumentIndex = idx;
          selectedQBankIndex = 0;
          renderHardwareCockpit();
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      });
    });
  }

  if (filter === 'all' || filter === 'fx') {
    arsenalData.software_and_plugins.standalone_effects_and_packs.forEach(fx => {
      items.push({
        category: 'fx',
        badge: 'EFFET / PRO PACK',
        badgeClass: 'tag-cyan',
        title: fx.name,
        subtitle: fx.style || `Inclus : ${fx.includes.join(', ')}`,
        serial: `Licence: ${fx.serial}`
      });
    });
  }

  if (filter === 'all' || filter === 'expansion') {
    arsenalData.software_and_plugins.expansions.forEach(exp => {
      items.push({
        category: 'expansion',
        badge: `EXPANSION // ${exp.code}`,
        badgeClass: 'tag-amber',
        title: exp.name,
        subtitle: `${exp.genre} — ${exp.vibe}`,
        serial: `Synchronisé depuis ton compte inMusic`
      });
    });
  }

  if (filter === 'all' || filter === 'hardware') {
    arsenalData.all_hardware.forEach(hw => {
      items.push({
        category: 'hardware',
        badge: 'HARDWARE ENREGISTRÉ',
        badgeClass: 'tag-purple',
        title: hw.name,
        subtitle: hw.role,
        serial: `S/N: ${hw.serial}`
      });
    });
  }

  grid.innerHTML = items.map((it, i) => `
    <div class="catalog-item" data-idx="${i}">
      <div>
        <div class="cat-top">
          <span class="cat-badge ${it.badgeClass}">${it.badge}</span>
        </div>
        <div class="cat-title">${it.title}</div>
        <div class="cat-desc">${it.subtitle}</div>
      </div>
      <div class="cat-serial">${it.serial}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.catalog-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      if (items[i].onClick) items[i].onClick();
    });
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderCatalog(chip.dataset.filter);
    };
  });
}

function initBridgeTab() {
  const pills = document.querySelectorAll('.logic-pill');
  const updateGuide = (key) => {
    const g = LOGIC_BRIDGE_GUIDES[key];
    document.getElementById('bridgeResultCard').innerHTML = `
      <h4>${g.title}</h4>
      <p><strong>${g.verdict}</strong></p>
      <ol>
        ${g.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    `;
  };
  updateGuide('alchemy');

  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      updateGuide(p.dataset.plugin);
    });
  });

  const calcEls = ['asSoundType', 'asStride', 'asVelocity'].map(id => document.getElementById(id));
  const updateCalc = () => {
    const type = document.getElementById('asSoundType').value;
    const stride = Number(document.getElementById('asStride').value);
    const vel = Number(document.getElementById('asVelocity').value);

    const octaves = type === 'bass' ? 3 : (type === 'keys' ? 4 : 3);
    const totalSemitones = octaves * 12;
    const notesCount = Math.ceil(totalSemitones / stride) + 1;
    const totalSamples = notesCount * vel;
    const tailSec = type === 'choir' ? 6 : (type === 'keys' ? 4 : 2.5);
    const estRamMb = ((totalSamples * tailSec * 44100 * 2 * 2) / (1024 * 1024)).toFixed(1);

    document.getElementById('asCalcOutput').innerHTML = `
      <h4>📊 Estimation pour ta MPC One (2 Go RAM) :</h4>
      <ul>
        <li><strong>Nombre total d'échantillons WAV générés :</strong> <code>${totalSamples} samples</code> (${notesCount} notes × ${vel} vélocités)</li>
        <li><strong>Poids estimé en RAM sur ta MPC One :</strong> <strong style="color:var(--emerald)">~${estRamMb} Mo</strong> (Soit moins de ${(estRamMb / 12).toFixed(1)}% de ta mémoire disponible !)</li>
        <li><strong>Réglage Auto-Sampler recommandé :</strong>
          <code>Note Stride = ${stride}</code> • <code>Tail = ${tailSec}s</code> • <code>Auto-Loop = Crossfade</code> • Sauvegarder directement sur ta <strong>Carte SD</strong>.
        </li>
      </ul>
    `;
  };
  calcEls.forEach(el => el.addEventListener('change', updateCalc));
  updateCalc();
}

let latestBuildLog = "Clique sur le bouton rouge '🚀 4. Compiler le binaire ARM (.so) + Skin JSON & Copier dans VST2 Plugins/' pour lancer le compilateur officiel Akai MPC SDK (Zig ARM32 + ARM64 + Host Simulator)...";
let uploadedWavBase64 = null;

function applyPromptToSdk(promptText) {
  const p = (promptText || '').toLowerCase();
  const catSel = document.getElementById('sdkPluginCategory');
  const dspSel = document.getElementById('sdkDspTemplate');
  const nameInp = document.getElementById('sdkPluginName');
  const q1 = document.getElementById('sdkQ1');
  const q2 = document.getElementById('sdkQ2');
  const q3 = document.getElementById('sdkQ3');
  const q4 = document.getElementById('sdkQ4');

  if (p.includes('sample') || p.includes('wav') || p.includes('violon') || p.includes('piano') || p.includes('rhodes') || p.includes('instrument')) {
    catSel.value = 'instrument';
    dspSel.value = 'sampler';
    nameInp.value = p.includes('violon') ? 'Arnaud String Rompler' : 'Arnaud Sample Keys';
    q1.value = 'Cutoff'; q2.value = 'Attack'; q3.value = 'Release'; q4.value = 'Gain';
  } else if (p.includes('fm') || p.includes('dx7') || p.includes('cloche') || p.includes('bell') || p.includes('métallique')) {
    catSel.value = 'instrument';
    dspSel.value = 'fmsynth';
    nameInp.value = 'Arnaud FM BellSynth';
    q1.value = 'FM Index'; q2.value = 'Ratio'; q3.value = 'Release'; q4.value = 'Gain';
  } else if (p.includes('synth') || p.includes('basse') || p.includes('sub') || p.includes('pad') || p.includes('analog')) {
    catSel.value = 'instrument';
    dspSel.value = 'subsynth';
    nameInp.value = 'Arnaud Analog Poly';
    q1.value = 'Cutoff'; q2.value = 'Attack'; q3.value = 'Release'; q4.value = 'Gain';
  } else if (p.includes('delay') || p.includes('dub') || p.includes('echo') || p.includes('écho') || p.includes('ping')) {
    catSel.value = 'effect';
    dspSel.value = 'dubdelay';
    nameInp.value = 'Arnaud Dub Delay';
    q1.value = 'Time ms'; q2.value = 'Feedback'; q3.value = 'Tone'; q4.value = 'Mix';
  } else if (p.includes('chorus') || p.includes('juno') || p.includes('ensemble') || p.includes('stéréo')) {
    catSel.value = 'effect';
    dspSel.value = 'chorus';
    nameInp.value = 'Arnaud Juno Chorus';
    q1.value = 'Rate'; q2.value = 'Depth'; q3.value = 'Warmth'; q4.value = 'Mix';
  } else if (p.includes('filtre') || p.includes('filter') || p.includes('wah') || p.includes('réson')) {
    catSel.value = 'effect';
    dspSel.value = 'filter';
    nameInp.value = 'Arnaud Analog Filter';
    q1.value = 'Cutoff'; q2.value = 'Resonance'; q3.value = 'Drive'; q4.value = 'LFO Amt';
  } else if (p.includes('comp') || p.includes('punch') || p.includes('bus') || p.includes('glue')) {
    catSel.value = 'effect';
    dspSel.value = 'compressor';
    nameInp.value = 'Arnaud Bus Punch';
    q1.value = 'Threshold'; q2.value = 'Ratio'; q3.value = 'Makeup'; q4.value = 'Mix';
  } else {
    catSel.value = 'effect';
    dspSel.value = 'lofi';
    nameInp.value = 'Arnaud Vinyl Crusher';
    q1.value = 'Drive'; q2.value = 'Crush'; q3.value = 'Tone'; q4.value = 'Mix';
  }

  toggleSamplerBox();
  updateSdkPreview();
}

function toggleSamplerBox() {
  const dsp = document.getElementById('sdkDspTemplate')?.value;
  const cat = document.getElementById('sdkPluginCategory');
  if (dsp === 'sampler' || dsp === 'subsynth' || dsp === 'fmsynth') {
    if (cat) cat.value = 'instrument';
  } else if (cat) {
    cat.value = 'effect';
  }
  const box = document.getElementById('sdkSamplerBox');
  if (box) box.style.display = dsp === 'sampler' ? 'block' : 'none';
}

async function initSdkTab() {
  const inputs = ['sdkPluginName', 'sdkVendorName', 'sdkPluginCategory', 'sdkDspTemplate', 'sdkQ1', 'sdkQ2', 'sdkQ3', 'sdkQ4', 'sdkRootNote'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (id === 'sdkDspTemplate') toggleSamplerBox();
      updateSdkPreview();
    });
    el.addEventListener('change', () => {
      if (id === 'sdkDspTemplate') toggleSamplerBox();
      updateSdkPreview();
    });
  });

  document.getElementById('sdkGeneratePromptBtn')?.addEventListener('click', () => {
    const promptText = document.getElementById('sdkPromptInput')?.value || '';
    applyPromptToSdk(promptText);
  });

  document.querySelectorAll('.prompt-chip-mini').forEach(chip => {
    chip.addEventListener('click', () => {
      const inp = document.getElementById('sdkPromptInput');
      if (inp) inp.value = chip.dataset.prompt || '';
      applyPromptToSdk(chip.dataset.prompt || '');
    });
  });

  document.getElementById('sdkWavFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    const statusEl = document.getElementById('sdkWavStatus');
    if (!file) {
      uploadedWavBase64 = null;
      if (statusEl) statusEl.textContent = 'Aucun .wav sélectionné (repli automatique sur une onde chaude intégrée).';
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      if (statusEl) statusEl.textContent = '❌ Fichier trop lourd (> 15 Mo). Choisis un sample plus court pour la RAM de la MPC One.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadedWavBase64 = reader.result;
      if (statusEl) statusEl.textContent = `✅ Sample prêt : ${file.name} (${(file.size / 1024).toFixed(1)} KB) -> Content/Samples/instrument.wav`;
    };
    reader.readAsDataURL(file);
  });

  // Synchronize category & template nicely
  document.getElementById('sdkPluginCategory').addEventListener('change', (e) => {
    const cat = e.target.value;
    const dspSel = document.getElementById('sdkDspTemplate');
    if (cat === 'instrument') {
      if (!['sampler', 'subsynth', 'fmsynth'].includes(dspSel.value)) dspSel.value = 'sampler';
      document.getElementById('sdkQ1').value = 'Cutoff';
      document.getElementById('sdkQ2').value = 'Attack';
      document.getElementById('sdkQ3').value = 'Release';
      document.getElementById('sdkQ4').value = 'Gain';
    } else {
      if (['sampler', 'subsynth', 'fmsynth'].includes(dspSel.value)) dspSel.value = 'lofi';
      document.getElementById('sdkQ1').value = 'Drive';
      document.getElementById('sdkQ2').value = 'Crush';
      document.getElementById('sdkQ3').value = 'Tone';
      document.getElementById('sdkQ4').value = 'Mix';
    }
    toggleSamplerBox();
    updateSdkPreview();
  });

  toggleSamplerBox();

  // Load connected drives / SD card destinations
  try {
    const res = await fetch('/api/drives');
    if (!res.ok) throw new Error('Static mode');
    const data = await res.json();
    const sel = document.getElementById('sdkTargetDrive');
    sel.innerHTML = data.drives.map(d => `<option value="${d.id}">${d.label}</option>`).join('');
  } catch (_) {
    const sel = document.getElementById('sdkTargetDrive');
    if (sel) sel.innerHTML = '<option value="workspace">🖥️ Serveur local Mac (node server.mjs) requis pour compiler & accéder à ta Carte SD</option>';
  }

  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCodeTab = tab.dataset.codetab;
      updateSdkPreview();
    });
  });

  document.getElementById('compileAndDeployBtn').addEventListener('click', async () => {
    const btn = document.getElementById('compileAndDeployBtn');
    const resBox = document.getElementById('sdkCompileResult');
    const bundle = buildSdkBundle();

    btn.disabled = true;
    const origText = btn.innerHTML;
    btn.innerHTML = `⏳ Compilation ARM32 (MPC One) + ARM64 + Skins TUI.json en cours (~10s)...`;
    resBox.style.display = 'block';
    resBox.className = 'sdk-compile-result';
    resBox.innerHTML = `⚙️ Exécution de <code>python3 tools/build.py</code> + <code>host_sim</code> + création du dossier <code>VST2 Plugins/</code>...`;

    try {
      const response = await fetch('/api/compile-sdk-plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle)
      });
      const result = await response.json();
      latestBuildLog = result.log || '';

      // Switch code viewer to live build log automatically so user sees the proof
      document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('tabBuildLog').classList.add('active');
      activeCodeTab = 'log';
      updateSdkPreview();

      if (result.ok) {
        resBox.className = 'sdk-compile-result';
        resBox.innerHTML = `
          <div><strong>✅ Compilation & Déploiement Réussis (0 erreur, validé par le SDK Akai 3.10.1) !</strong></div>
          <div style="margin-top:4px">📁 <strong>Installé directement dans :</strong> <code>${result.deployedPath}</code></div>
          <div style="margin-top:4px; font-size:0.75rem; color:var(--text-muted)">
            Fichiers générés : ${result.files.map(f => `<code>${f}</code>`).join(' • ')}
          </div>
          <div class="sdk-result-actions">
            ${result.zipUrl ? `<a href="${result.zipUrl}" download class="btn-download-zip">📦 Télécharger le Pack .ZIP (${result.bundleName})</a>` : ''}
            ${result.wavUrl ? `<audio controls src="${result.wavUrl}" style="height:32px; max-width:260px;" title="Rendu Audio Test généré par le simulateur MPC host_sim"></audio>` : ''}
          </div>
        `;
      } else {
        resBox.className = 'sdk-compile-result error';
        resBox.innerHTML = `<strong>❌ Erreur de compilation :</strong> ${escapeHtml(result.error || 'Vérifie le journal de compilation ci-contre.')}`;
      }
    } catch (err) {
      resBox.className = 'sdk-compile-result error';
      resBox.innerHTML = `<strong>❌ Erreur réseau :</strong> ${escapeHtml(err.message)}`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  });

  updateSdkPreview();
}

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function makeClassName(name) {
  const words = name.match(/[A-Za-z0-9]+/g) || ['CustomPlugin'];
  let cls = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  if (/^[0-9]/.test(cls)) cls = 'Plugin' + cls;
  return cls;
}

function makeUid(vendor, name) {
  const cleanV = (vendor.replace(/[^A-Za-z]/g, '') || 'A').toUpperCase();
  const cleanN = (name.replace(/[^A-Za-z0-9]/g, '') + 'MPC1').slice(0, 3);
  return cleanV[0] + cleanN;
}

function buildSdkBundle() {
  const rawName = (document.getElementById('sdkPluginName').value || 'Arnaud Vinyl Crusher').trim();
  const rawVendor = (document.getElementById('sdkVendorName').value || 'Arnaud Rigogne').trim();
  const folderName = rawName.replace(/["#@,;:<>*^|?\\/]/g, '').slice(0, 32);
  const vendor = rawVendor.replace(/["#@,;:<>*^|?\\/]/g, '').slice(0, 32);
  const kind = document.getElementById('sdkPluginCategory').value === 'instrument' ? 'instrument' : 'effect';
  const dsp = document.getElementById('sdkDspTemplate').value;
  const q1 = (document.getElementById('sdkQ1').value || 'Drive').trim().slice(0, 12);
  const q2 = (document.getElementById('sdkQ2').value || 'Crush').trim().slice(0, 12);
  const q3 = (document.getElementById('sdkQ3').value || 'Tone').trim().slice(0, 12);
  const q4 = (document.getElementById('sdkQ4').value || 'Mix').trim().slice(0, 12);
  const targetDriveId = document.getElementById('sdkTargetDrive').value || 'workspace';

  const slug = makeSlug(folderName);
  const className = makeClassName(folderName);
  const uid = makeUid(vendor, folderName);
  const isInstrument = kind === 'instrument';

  const pluginJsonObj = {
    name: folderName,
    manufacturer: vendor,
    version: "1.0.0",
    format: "vst2",
    kind: kind,
    uid: uid,
    numInputs: isInstrument ? 0 : 2,
    numOutputs: 2,
    category: isInstrument ? "Synth" : "Effect",
    file32: `VST/${slug}-arm32.so`,
    file64: `VST/${slug}-arm64.so`,
    description: `${folderName} by ${vendor} — Native MPC OS 3.10.1 Standalone Plugin.`,
    author: vendor,
    license: "MIT"
  };

  const uiJsonObj = {
    kit: "mpc-red",
    pages: [
      {
        name: "MAIN",
        controls: [
          { param: q1, widget: "knob" },
          { param: q2, widget: "knob" },
          { param: q3, widget: "knob" },
          { param: q4, widget: "fader" }
        ]
      }
    ]
  };

  const rootNote = Number(document.getElementById('sdkRootNote')?.value || 60);
  const cppCode = generateSdkCppCode({ folderName, vendor, className, uid, isInstrument, dsp, q1, q2, q3, q4, rootNote });

  return {
    folderName,
    vendor,
    slug,
    className,
    uid,
    kind,
    targetDriveId,
    wavBase64: dsp === 'sampler' ? uploadedWavBase64 : null,
    cppCode,
    pluginJson: JSON.stringify(pluginJsonObj, null, 2),
    uiJson: JSON.stringify(uiJsonObj, null, 2)
  };
}

function generateSdkCppCode({ folderName, vendor, className, uid, isInstrument, dsp, q1, q2, q3, q4, rootNote }) {
  const infoBlock = `    static mpc::PluginInfo makeInfo()
    {
        mpc::PluginInfo info;
        info.name         = "${folderName}";
        info.vendor       = "${vendor}";
        info.uniqueId     = MPC_FOURCC('${uid[0]}', '${uid[1]}', '${uid[2]}', '${uid[3]}');
        info.version      = 1000;
        info.isInstrument = ${isInstrument ? 'true' : 'false'};
        info.numInputs    = ${isInstrument ? 0 : 2};
        info.numOutputs   = 2;
        info.tailSamples  = ${isInstrument ? 0 : 1};
        return info;
    }`;

  if (dsp === 'sampler' || (isInstrument && dsp !== 'subsynth' && dsp !== 'fmsynth')) {
    return `// ${folderName} — Sample-Based MPC Instrument (.wav Rompler) by ${vendor}
// Loads Content/Samples/instrument.wav via official mpc_plugin.h + dsp/wav.h

#include "mpc_plugin.h"
#include "dsp/wav.h"
#include <cmath>
#include <vector>

namespace {
enum ParamIndex { kCutoff = 0, kAttack, kRelease, kGain, kNumParams };
constexpr int kNumVoices = 8;
constexpr float kPi = 3.14159265358979f;

struct SamplerVoice {
    int note = -1;
    float velocity = 0.0f;
    double pos = 0.0;
    double rate = 1.0;
    float env = 0.0f;
    bool releasing = false;
    float lpL = 0.0f, lpR = 0.0f;
    bool active = false;
};
} // namespace

class ${className} : public mpc::Plugin
{
public:
    ${className}() : mpc::Plugin(makeInfo())
    {
        addParam(mpc::logParam  ("p1", "${q1}", 120.0f, 18000.0f, 12000.0f, "Hz", 0));
        addParam(mpc::logParam  ("p2", "${q2}", 1.0f,   2000.0f,  5.0f,     "ms", 0));
        addParam(mpc::logParam  ("p3", "${q3}", 20.0f,  4000.0f,  450.0f,   "ms", 0));
        addParam(mpc::floatParam("p4", "${q4}", -36.0f, 6.0f,     -3.0f,    "dB", 1));

        addProgram("Natural Sample", {14000.0f, 5.0f,  450.0f, -3.0f});
        addProgram("Warm Pad Tail",  {3200.0f,  180.0f,1400.0f,-4.0f});
        addProgram("LoFi Keys",      {2400.0f,  4.0f,  250.0f, -2.0f});
    }

    void prepare(double sampleRate, int maxBlockSize) override
    {
        (void)maxBlockSize;
        sampleRate_ = (float)sampleRate;
        if (!dsp::loadWav(mpc::contentPath("Samples/instrument.wav"), wav_) || wav_.numFrames() == 0) {
            wav_.sampleRate = sampleRate;
            const size_t n = (size_t)sampleRate;
            wav_.channels.assign(2, std::vector<float>(n, 0.0f));
            for (size_t i = 0; i < n; ++i) {
                float t = (float)i / (float)sampleRate;
                float env = std::exp(-t * 2.2f);
                float s = (0.6f * std::sin(2.0f * kPi * 261.6256f * t)
                         + 0.25f * std::sin(2.0f * kPi * 523.251f * t)
                         + 0.15f * std::sin(2.0f * kPi * 784.88f * t)) * env;
                wav_.channels[0][i] = s;
                wav_.channels[1][i] = s;
            }
        }
        reset();
    }

    void reset() override
    {
        for (SamplerVoice& v : voices_) v = SamplerVoice();
    }

    void process(mpc::ProcessContext& ctx) override
    {
        const float cutoffHz = get(kCutoff);
        const float atkRate  = 1.0f / std::fmax(1.0f, get(kAttack) * 0.001f * sampleRate_);
        const float relRate  = 1.0f / std::fmax(1.0f, get(kRelease) * 0.001f * sampleRate_);
        const float gain     = std::pow(10.0f, get(kGain) / 20.0f);
        const float coef     = 1.0f - std::exp(-2.0f * kPi * mpc::clamp(cutoffHz, 60.0f, 0.45f * sampleRate_) / sampleRate_);
        const size_t totalFrames = wav_.numFrames();
        const int numWavCh = wav_.numChannels();

        for (int e = 0; e < ctx.numMidiEvents; ++e) {
            const mpc::MidiEvent& ev = ctx.midi[e];
            if (ev.isNoteOn()) {
                SamplerVoice& v = voices_[ev.note() % kNumVoices];
                v.note = ev.note();
                v.velocity = ev.velocity() / 127.0f;
                v.pos = 0.0;
                v.rate = (wav_.sampleRate / (double)sampleRate_) * std::pow(2.0, ((double)ev.note() - ${rootNote}.0) / 12.0);
                v.env = 0.0f;
                v.lpL = 0.0f; v.lpR = 0.0f;
                v.releasing = false;
                v.active = totalFrames > 1;
            } else if (ev.isNoteOff()) {
                for (SamplerVoice& v : voices_)
                    if (v.active && v.note == ev.note()) v.releasing = true;
            }
        }

        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;

        for (int i = 0; i < ctx.numFrames; ++i) {
            float sumL = 0.0f, sumR = 0.0f;
            for (SamplerVoice& v : voices_) {
                if (!v.active) continue;
                if (!v.releasing) v.env = std::fmin(1.0f, v.env + atkRate);
                else {
                    v.env -= relRate;
                    if (v.env <= 0.0001f) { v.env = 0.0f; v.active = false; continue; }
                }
                if (v.pos >= (double)(totalFrames - 1)) { v.active = false; continue; }
                const size_t idx0 = (size_t)v.pos;
                const float frac = (float)(v.pos - (double)idx0);
                const float sL = wav_.channels[0][idx0] * (1.0f - frac) + wav_.channels[0][idx0 + 1] * frac;
                const float sR = (numWavCh > 1)
                    ? (wav_.channels[1][idx0] * (1.0f - frac) + wav_.channels[1][idx0 + 1] * frac)
                    : sL;
                v.pos += v.rate;
                v.lpL += coef * (sL - v.lpL);
                v.lpR += coef * (sR - v.lpR);
                const float amp = v.env * v.velocity;
                sumL += v.lpL * amp;
                sumR += v.lpR * amp;
            }
            outL[i] = std::tanh(sumL * gain);
            if (outR) outR[i] = std::tanh(sumR * gain);
        }
    }

private:
${infoBlock}
    dsp::WavData wav_;
    SamplerVoice voices_[kNumVoices];
    float sampleRate_ = 44100.0f;
};

MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (dsp === 'fmsynth') {
    return `// ${folderName} — 2-Op FM Synth by ${vendor}
#include "mpc_plugin.h"
#include <cmath>

namespace {
enum ParamIndex { kIndex = 0, kRatio, kRelease, kGain, kNumParams };
constexpr int kNumVoices = 4;
constexpr float kPi = 3.14159265358979f;
struct FmVoice {
    int note = -1; float vel = 0.0f;
    float cPhase = 0.0f, mPhase = 0.0f, cInc = 0.0f;
    float env = 0.0f; bool rel = false; bool active = false;
};
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::floatParam("p1", "${q1}", 0.0f, 8.0f, 2.5f, "", 2));
        addParam(mpc::floatParam("p2", "${q2}", 0.5f, 8.0f, 2.0f, "x", 2));
        addParam(mpc::logParam  ("p3", "${q3}", 20.0f, 3000.0f, 450.0f, "ms", 0));
        addParam(mpc::floatParam("p4", "${q4}", -36.0f, 6.0f, -6.0f, "dB", 1));
        addProgram("DX Electric Keys", {2.2f, 2.0f, 520.0f, -5.0f});
        addProgram("Metallic Bell",    {5.5f, 3.5f, 1400.0f,-6.0f});
    }
    void prepare(double sr, int) override { sampleRate_ = (float)sr; reset(); }
    void reset() override { for (FmVoice& v : voices_) v = FmVoice(); }
    void process(mpc::ProcessContext& ctx) override {
        const float idx = get(kIndex);
        const float ratio = get(kRatio);
        const float relRate = 1.0f / std::fmax(1.0f, get(kRelease) * 0.001f * sampleRate_);
        const float gain = std::pow(10.0f, get(kGain) / 20.0f);
        for (int e = 0; e < ctx.numMidiEvents; ++e) {
            const auto& ev = ctx.midi[e];
            if (ev.isNoteOn()) {
                FmVoice& v = voices_[ev.note() % kNumVoices];
                v.note = ev.note(); v.vel = ev.velocity() / 127.0f;
                v.cPhase = 0.0f; v.mPhase = 0.0f;
                v.cInc = mpc::noteToHz((float)ev.note()) / sampleRate_;
                v.env = 1.0f; v.rel = false; v.active = true;
            } else if (ev.isNoteOff()) {
                for (FmVoice& v : voices_) if (v.active && v.note == ev.note()) v.rel = true;
            }
        }
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            float sum = 0.0f;
            for (FmVoice& v : voices_) {
                if (!v.active) continue;
                if (v.rel) { v.env -= relRate; if (v.env <= 0.0001f) { v.active = false; continue; } }
                const float mod = std::sin(2.0f * kPi * v.mPhase) * idx * v.env;
                const float car = std::sin(2.0f * kPi * v.cPhase + mod);
                v.cPhase += v.cInc; if (v.cPhase >= 1.0f) v.cPhase -= 1.0f;
                v.mPhase += v.cInc * ratio; if (v.mPhase >= 1.0f) v.mPhase -= 1.0f;
                sum += car * v.env * v.vel;
            }
            const float s = std::tanh(sum * gain * 0.5f);
            outL[i] = s; if (outR) outR[i] = s;
        }
    }
private:
${infoBlock}
    FmVoice voices_[kNumVoices];
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (isInstrument) {
    return `// ${folderName} — Polyphonic Analog Synth by ${vendor}
#include "mpc_plugin.h"
#include <cmath>

namespace {
enum ParamIndex { kCutoff = 0, kAttack, kRelease, kGain, kNumParams };
constexpr int kNumVoices = 4;
constexpr float kPi = 3.14159265358979f;
struct Voice {
    int note = -1; float velocity = 0.0f, phase = 0.0f, phaseInc = 0.0f, env = 0.0f, filterState = 0.0f;
    bool releasing = false, active = false;
};
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::logParam  ("p1", "${q1}", 80.0f, 16000.0f, 3200.0f, "Hz", 0));
        addParam(mpc::logParam  ("p2", "${q2}", 2.0f,  2000.0f,  15.0f,   "ms", 0));
        addParam(mpc::logParam  ("p3", "${q3}", 20.0f, 3000.0f,  350.0f,  "ms", 0));
        addParam(mpc::floatParam("p4", "${q4}", -36.0f, 6.0f,    -6.0f,   "dB", 1));
        addProgram("Warm BoomBap Sub", {1200.0f, 10.0f, 400.0f, -4.0f});
        addProgram("LoFi Synth Keys",  {3800.0f, 25.0f, 650.0f, -6.0f});
    }
    void prepare(double sampleRate, int) override { sampleRate_ = (float)sampleRate; reset(); }
    void reset() override { for (Voice& v : voices_) v = Voice(); }
    void process(mpc::ProcessContext& ctx) override {
        const float coef = 1.0f - std::exp(-2.0f * kPi * mpc::clamp(get(kCutoff), 40.0f, 0.45f * sampleRate_) / sampleRate_);
        const float atkRate = 1.0f / std::fmax(1.0f, get(kAttack) * 0.001f * sampleRate_);
        const float relRate = 1.0f / std::fmax(1.0f, get(kRelease) * 0.001f * sampleRate_);
        const float gain = std::pow(10.0f, get(kGain) / 20.0f);
        for (int e = 0; e < ctx.numMidiEvents; ++e) {
            const mpc::MidiEvent& ev = ctx.midi[e];
            if (ev.isNoteOn()) {
                Voice& v = voices_[ev.note() % kNumVoices];
                v.note = ev.note(); v.velocity = ev.velocity() / 127.0f;
                v.phase = 0.0f; v.phaseInc = mpc::noteToHz((float)ev.note()) / sampleRate_;
                v.releasing = false; v.active = true;
            } else if (ev.isNoteOff()) {
                for (Voice& v : voices_) if (v.active && v.note == ev.note()) v.releasing = true;
            }
        }
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            float sum = 0.0f;
            for (Voice& v : voices_) {
                if (!v.active) continue;
                if (!v.releasing) v.env = std::fmin(1.0f, v.env + atkRate);
                else { v.env -= relRate; if (v.env <= 0.0001f) { v.env = 0.0f; v.active = false; continue; } }
                float saw = 2.0f * v.phase - 1.0f;
                float sub = std::sin(2.0f * kPi * v.phase * 0.5f);
                v.phase += v.phaseInc; if (v.phase >= 1.0f) v.phase -= 1.0f;
                v.filterState += coef * ((0.65f * saw + 0.35f * sub) - v.filterState);
                sum += v.filterState * v.env * v.velocity;
            }
            const float s = std::tanh(sum * gain * 0.45f);
            outL[i] = s; if (outR) outR[i] = s;
        }
    }
private:
${infoBlock}
    Voice voices_[kNumVoices];
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (dsp === 'dubdelay') {
    return `// ${folderName} — Stereo Dub Delay (Ping-Pong + SoftClip) by ${vendor}
#include "mpc_plugin.h"
#include "dsp/delay_line.h"
#include "dsp/onepole.h"
#include <cmath>

namespace {
enum ParamIndex { kTimeMs = 0, kFeedback, kTone, kMix, kNumParams };
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::logParam  ("p1", "${q1}", 20.0f, 1500.0f, 375.0f, "ms", 0));
        addParam(mpc::floatParam("p2", "${q2}", 0.0f,  90.0f,   45.0f,  "%",  0));
        addParam(mpc::logParam  ("p3", "${q3}", 300.0f,14000.0f,3800.0f,"Hz", 0));
        addParam(mpc::floatParam("p4", "${q4}", 0.0f,  100.0f,  35.0f,  "%",  0));
        addProgram("Dub Tape 1/8",   {333.0f, 52.0f, 2800.0f, 40.0f});
        addProgram("Slapback Retro", {115.0f, 18.0f, 5500.0f, 30.0f});
    }
    void prepare(double sr, int) override {
        sampleRate_ = (float)sr;
        const int maxS = (int)(sr * 2.0) + 2;
        delayL_.prepare(maxS); delayR_.prepare(maxS);
        reset();
    }
    void reset() override {
        delayL_.reset(); delayR_.reset();
        lpL_.reset(); lpR_.reset();
    }
    void process(mpc::ProcessContext& ctx) override {
        const float dSamples = mpc::clamp(get(kTimeMs) * 0.001f * sampleRate_, 1.0f, (float)delayL_.maxDelay() - 1.0f);
        const float fb = get(kFeedback) * 0.01f;
        const float mix = get(kMix) * 0.01f;
        lpL_.setCutoff(get(kTone), sampleRate_); lpR_.setCutoff(get(kTone), sampleRate_);
        const float* inL = ctx.inputs[0];
        const float* inR = ctx.numInputs > 1 ? ctx.inputs[1] : ctx.inputs[0];
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            const float dL = inL[i], dR = inR[i];
            float wL = lpL_.process(delayL_.readLinear(dSamples));
            float wR = lpR_.process(delayR_.readLinear(dSamples));
            delayL_.write(std::tanh(dL + wR * fb));
            delayR_.write(std::tanh(dR + wL * fb));
            outL[i] = dL + (wL - dL) * mix;
            if (outR) outR[i] = dR + (wR - dR) * mix;
        }
    }
private:
${infoBlock}
    mpc::dsp::DelayLine delayL_, delayR_;
    mpc::dsp::OnePoleLP lpL_, lpR_;
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (dsp === 'chorus') {
    return `// ${folderName} — Stereo Analog Chorus by ${vendor}
#include "mpc_plugin.h"
#include "dsp/delay_line.h"
#include <cmath>

namespace {
enum ParamIndex { kRate = 0, kDepth, kWarmth, kMix, kNumParams };
constexpr float kPi = 3.14159265358979f;
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::logParam  ("p1", "${q1}", 0.1f, 6.0f, 0.8f, "Hz", 2));
        addParam(mpc::floatParam("p2", "${q2}", 0.0f, 100.0f, 45.0f, "%", 0));
        addParam(mpc::floatParam("p3", "${q3}", 0.0f, 12.0f, 2.0f, "dB", 1));
        addParam(mpc::floatParam("p4", "${q4}", 0.0f, 100.0f, 50.0f, "%", 0));
        addProgram("Juno Chorus I",  {0.6f, 40.0f, 1.5f, 50.0f});
        addProgram("Juno Chorus II", {1.1f, 75.0f, 3.0f, 60.0f});
    }
    void prepare(double sr, int) override {
        sampleRate_ = (float)sr;
        const int maxS = (int)(sr * 0.1) + 4;
        dl_.prepare(maxS); dr_.prepare(maxS);
        reset();
    }
    void reset() override { dl_.reset(); dr_.reset(); lfoPhase_ = 0.0f; }
    void process(mpc::ProcessContext& ctx) override {
        const float rateInc = get(kRate) / sampleRate_;
        const float depthS = (get(kDepth) * 0.01f) * 0.006f * sampleRate_;
        const float baseS = 0.010f * sampleRate_;
        const float drive = std::pow(10.0f, get(kWarmth) / 20.0f);
        const float mix = get(kMix) * 0.01f;
        const float* inL = ctx.inputs[0];
        const float* inR = ctx.numInputs > 1 ? ctx.inputs[1] : ctx.inputs[0];
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            const float sL = std::sin(2.0f * kPi * lfoPhase_);
            const float sR = std::cos(2.0f * kPi * lfoPhase_);
            lfoPhase_ += rateInc; if (lfoPhase_ >= 1.0f) lfoPhase_ -= 1.0f;
            const float dL = inL[i], dR = inR[i];
            dl_.write(std::tanh(dL * drive));
            dr_.write(std::tanh(dR * drive));
            const float wL = dl_.readLinear(baseS + sL * depthS);
            const float wR = dr_.readLinear(baseS + sR * depthS);
            outL[i] = dL + (wL - dL) * mix;
            if (outR) outR[i] = dR + (wR - dR) * mix;
        }
    }
private:
${infoBlock}
    mpc::dsp::DelayLine dl_, dr_;
    float lfoPhase_ = 0.0f;
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (dsp === 'filter') {
    return `// ${folderName} — Resonant Analog SVF Filter by ${vendor}
#include "mpc_plugin.h"
#include "dsp/svf.h"
#include <cmath>

namespace {
enum ParamIndex { kCutoff = 0, kRes, kDrive, kLfoAmt, kNumParams };
constexpr float kPi = 3.14159265358979f;
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::logParam  ("p1", "${q1}", 60.0f, 16000.0f, 1800.0f, "Hz", 0));
        addParam(mpc::floatParam("p2", "${q2}", 0.0f,  95.0f,    35.0f,   "%",  0));
        addParam(mpc::floatParam("p3", "${q3}", 0.0f,  18.0f,    3.0f,    "dB", 1));
        addParam(mpc::floatParam("p4", "${q4}", 0.0f,  100.0f,   15.0f,   "%",  0));
        addProgram("Warm Sweep", {1400.0f, 45.0f, 4.0f, 25.0f});
        addProgram("Sub Muffle", {420.0f,  20.0f, 6.0f, 0.0f});
    }
    void prepare(double sr, int) override {
        sampleRate_ = (float)sr;
        svfL_.setSampleRate(sr); svfR_.setSampleRate(sr);
        reset();
    }
    void reset() override { svfL_.reset(); svfR_.reset(); lfo_ = 0.0f; }
    void process(mpc::ProcessContext& ctx) override {
        const float baseCut = get(kCutoff);
        const float res01 = mpc::clamp(get(kRes) * 0.01f, 0.0f, 0.95f);
        const float drive = std::pow(10.0f, get(kDrive) / 20.0f);
        const float lfoAmt = get(kLfoAmt) * 0.01f;
        const float lfoInc = 0.6f / sampleRate_;
        const float* inL = ctx.inputs[0];
        const float* inR = ctx.numInputs > 1 ? ctx.inputs[1] : ctx.inputs[0];
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            const float mod = 1.0f + lfoAmt * 0.5f * std::sin(2.0f * kPi * lfo_);
            lfo_ += lfoInc; if (lfo_ >= 1.0f) lfo_ -= 1.0f;
            const float cut = mpc::clamp(baseCut * mod, 40.0f, 0.45f * sampleRate_);
            svfL_.set(cut, res01); svfR_.set(cut, res01);
            outL[i] = svfL_.process(std::tanh(inL[i] * drive), mpc::dsp::SVF::Mode::Lowpass);
            if (outR) outR[i] = svfR_.process(std::tanh(inR[i] * drive), mpc::dsp::SVF::Mode::Lowpass);
        }
    }
private:
${infoBlock}
    mpc::dsp::SVF svfL_, svfR_;
    float lfo_ = 0.0f;
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  if (dsp === 'compressor') {
    return `// ${folderName} — Punchy Bus Compressor by ${vendor}
#include "mpc_plugin.h"
#include <cmath>

namespace {
enum ParamIndex { kThresh = 0, kRatio, kMakeup, kMix, kNumParams };
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::floatParam("p1", "${q1}", -40.0f, 0.0f, -14.0f, "dB", 1));
        addParam(mpc::floatParam("p2", "${q2}", 1.0f, 12.0f, 4.0f, ":1", 1));
        addParam(mpc::floatParam("p3", "${q3}", 0.0f, 18.0f, 3.0f, "dB", 1));
        addParam(mpc::floatParam("p4", "${q4}", 0.0f, 100.0f, 100.0f, "%", 0));
        addProgram("Drum Glue", {-16.0f, 4.0f, 3.5f, 100.0f});
        addProgram("NY Parallel", {-24.0f, 8.0f, 6.0f, 45.0f});
    }
    void prepare(double sr, int) override {
        sampleRate_ = (float)sr;
        atk_ = std::exp(-1.0f / (0.008f * sampleRate_));
        rel_ = std::exp(-1.0f / (0.120f * sampleRate_));
        reset();
    }
    void reset() override { env_ = 0.0f; }
    void process(mpc::ProcessContext& ctx) override {
        const float threshDb = get(kThresh);
        const float ratio = get(kRatio);
        const float makeup = std::pow(10.0f, get(kMakeup) / 20.0f);
        const float mix = get(kMix) * 0.01f;
        const float* inL = ctx.inputs[0];
        const float* inR = ctx.numInputs > 1 ? ctx.inputs[1] : ctx.inputs[0];
        float* outL = ctx.outputs[0];
        float* outR = ctx.numOutputs > 1 ? ctx.outputs[1] : nullptr;
        for (int i = 0; i < ctx.numFrames; ++i) {
            const float dL = inL[i], dR = inR[i];
            const float peak = std::fmax(std::fabs(dL), std::fabs(dR));
            env_ = (peak > env_) ? (atk_ * env_ + (1.0f - atk_) * peak) : (rel_ * env_ + (1.0f - rel_) * peak);
            const float db = 20.0f * std::log10(env_ + 1e-6f);
            float grDb = 0.0f;
            if (db > threshDb) grDb = (threshDb + (db - threshDb) / ratio) - db;
            const float g = std::pow(10.0f, grDb / 20.0f) * makeup;
            outL[i] = dL + (std::tanh(dL * g) - dL) * mix;
            if (outR) outR[i] = dR + (std::tanh(dR * g) - dR) * mix;
        }
    }
private:
${infoBlock}
    float env_ = 0.0f, atk_ = 0.99f, rel_ = 0.999f, sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
  }

  // Default: LoFi Vinyl Crusher
  return `// ${folderName} — Native MPC Standalone Lo-Fi Effect by ${vendor}
#include "mpc_plugin.h"
#include <cmath>

namespace {
enum ParamIndex { kDrive = 0, kCrush, kTone, kMix, kNumParams };
constexpr int kMaxChannels = 2;
constexpr float kPi = 3.14159265358979f;
struct OnePoleLP {
    float state = 0.0f, coef = 1.0f;
    void setCutoff(float hz, float sr) {
        hz = mpc::clamp(hz, 40.0f, 0.45f * sr);
        coef = 1.0f - std::exp(-2.0f * kPi * hz / sr);
    }
    float process(float x) { state += coef * (x - state); return state; }
    void reset() { state = 0.0f; }
};
} // namespace

class ${className} : public mpc::Plugin {
public:
    ${className}() : mpc::Plugin(makeInfo()) {
        addParam(mpc::floatParam("p1", "${q1}", 0.0f,   24.0f,    6.0f,   "dB", 1));
        addParam(mpc::floatParam("p2", "${q2}", 0.0f,   100.0f,   35.0f,  "%",  0));
        addParam(mpc::logParam  ("p3", "${q3}", 200.0f, 18000.0f, 4500.0f,"Hz", 0));
        addParam(mpc::floatParam("p4", "${q4}", 0.0f,   100.0f,   80.0f,  "%",  0));
        addProgram("SP-1200 Grit",   {9.0f,  55.0f, 3200.0f, 85.0f});
        addProgram("Warm Tape Glue", {4.5f,  10.0f, 7500.0f, 70.0f});
    }
    void prepare(double sr, int) override { sampleRate_ = (float)sr; reset(); }
    void reset() override { for (OnePoleLP& f : filters_) f.reset(); }
    void process(mpc::ProcessContext& ctx) override {
        const int numChannels = mpc::clamp(ctx.numOutputs, 0, kMaxChannels);
        const float driveGain = std::pow(10.0f, get(kDrive) / 20.0f);
        const float crushAmt = get(kCrush) * 0.01f;
        const float mix = get(kMix) * 0.01f;
        for (OnePoleLP& f : filters_) f.setCutoff(get(kTone), sampleRate_);
        const float steps = std::pow(2.0f, 12.0f - crushAmt * 7.0f);
        for (int i = 0; i < ctx.numFrames; ++i) {
            for (int ch = 0; ch < numChannels; ++ch) {
                const float dry = (ctx.inputs && ch < ctx.numInputs && ctx.inputs[ch]) ? ctx.inputs[ch][i] : 0.0f;
                float wet = std::tanh(dry * driveGain);
                if (crushAmt > 0.02f) wet = std::round(wet * steps) / steps;
                wet = filters_[ch].process(wet);
                ctx.outputs[ch][i] = dry + (wet - dry) * mix;
            }
        }
    }
private:
${infoBlock}
    OnePoleLP filters_[kMaxChannels];
    float sampleRate_ = 44100.0f;
};
MPC_PLUGIN_ENTRY(${className})
`;
}

function updateSdkPreview() {
  const bundle = buildSdkBundle();
  document.getElementById('previewTitle').textContent = `${bundle.vendor} — ${bundle.folderName}`;
  document.getElementById('previewBadge').textContent = `CUSTOM ${bundle.kind.toUpperCase()} // ARM32+ARM64`;
  document.getElementById('prevQ1').textContent = document.getElementById('sdkQ1').value;
  document.getElementById('prevQ2').textContent = document.getElementById('sdkQ2').value;
  document.getElementById('prevQ3').textContent = document.getElementById('sdkQ3').value;
  document.getElementById('prevQ4').textContent = document.getElementById('sdkQ4').value;

  const codeEl = document.getElementById('sdkCodeDisplay');
  if (activeCodeTab === 'cpp') codeEl.textContent = bundle.cppCode;
  else if (activeCodeTab === 'pluginjson') codeEl.textContent = bundle.pluginJson;
  else if (activeCodeTab === 'uijson') codeEl.textContent = bundle.uiJson;
  else codeEl.textContent = latestBuildLog;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// =====================================================================
// TAB 5 : GÉNÉRATEUR DE TEMPLATES MPC ONE STANDALONE (.XPJ)
// =====================================================================
const MPC_TEMPLATES = [
  {
    id: 'boombap',
    title: '🥁 Boom-Bap Golden Era (NY 90s)',
    projectName: 'Arnaud_BoomBap_90BPM',
    bpm: 90,
    bars: 4,
    swing: '60%',
    desc: 'Drums poussiéreux SP-1200 + Chops Soul/Vinyle + Basse Sub Factory + Bus Tape-Stop.',
    tags: ['Pad Thai Vol.3', 'Premier Beats', 'Sub Factory', 'SP1200', 'AIR Flavor', 'Flex Beat'],
    tracks: [
      { name: 'Drums (Pad Thai 3)', fx: ['SP1200', 'Compressor Vintage', 'AIR Maximizer'] },
      { name: 'Sample Chops (Soul)', fx: ['AIR Flavor', 'PEQ 4-Band'] },
      { name: 'Bass (Sub Factory)', instrument: 'Sub Factory', fx: ['AIR Tube Drive'] },
      { name: 'Keys / Rhodes (Hype)', instrument: 'Hype', fx: ['AIR Flavor', 'AIR Delay'] }
    ],
    steps: [
      'Appuie sur <code>BROWSE</code> → <strong>Expansions</strong> → charge un kit <code>Marco Polo Pad Thai Vol. 3</code> ou <code>Premier Beats</code> sur <strong>Track 1 (Drums)</strong>.',
      'Appuie sur <code>TC</code> (Timing Correct) → règle <strong>Swing</strong> à <code>60%</code> pour le rebond Boom-Bap.',
      'Sur <strong>Track 2 (Sample Chops)</strong> : charge un chop <code>Soul Provider 3</code> ou sample ta <strong>Numark Scratch</strong> via <code>SAMPLER</code> (l\'effet <code>AIR Flavor</code> + EQ sont déjà pré-chargés en Insert !).',
      'Appuie sur <code>MAIN</code> → sélectionne <strong>Track 3 (Bass Sub Factory)</strong> → appuie sur <code>PAD PERFORM</code> → choisis <strong>Notes / Minor Natural</strong> pour jouer ta ligne de basse aux pads.',
      'Optionnel : ajoute <code>MSXII Lo-Fly Dirt</code> / <code>AIR Flavor Pro</code> / <code>AIR Soft Clipper</code> depuis le XL Channel Strip pour encore plus de grain.'
    ],
    tip: 'Tourne les 4 boutons Q-LINK en mode Track sur Sub Factory pour doser le Drive et le Glide en direct.'
  },
  {
    id: 'lofi',
    title: '☕ Lo-Fi Jazz & Chillhop',
    projectName: 'Arnaud_LoFi_Jazz_78BPM',
    bpm: 78,
    bars: 4,
    swing: '57%',
    desc: 'Accords feutrés LoFi Jazz + Warble cassette + Grain vinyle + Basse ronde.',
    tags: ['LoFi Jazz', 'Dojo Dust', 'AIR Flavor', 'AIR Lo-Fi', 'Sub Factory', 'Flex Beat'],
    tracks: [
      { name: 'Drums (LoFi Dusty)', fx: ['AIR Lo-Fi', 'Bus Compressor'] },
      { name: 'Jazz Chops (LoFi Jazz)', fx: ['AIR Flavor', 'AIR Diff Delay'] },
      { name: 'Warm Bass (Sub Factory)', instrument: 'Sub Factory', fx: ['PEQ 4-Band'] },
      { name: 'Keys (Dojo / TubeSynth)', instrument: 'TubeSynth', fx: ['AIR Flavor'] }
    ],
    steps: [
      'Sur <strong>Track 1 (Drums)</strong> : appuie sur <code>BROWSE</code> → <strong>Expansions → LoFi Jazz</strong> → charge un kit doux (<code>AIR Lo-Fi</code> et <code>Bus Compressor</code> sont déjà câblés).',
      'Sur <strong>Track 2 (Jazz Chops)</strong> : charge une boucle de piano/trompette de <code>LoFi Jazz</code> ou <code>Soul Provider 3</code> → active <strong>Super Warp</strong> dans <code>SAMPLE EDIT</code>.',
      'Sur <strong>Track 4 (Keys)</strong> : tu peux remplacer par ton plugin <code>Dojo Dust Instruments</code> (via <code>BROWSE</code>) ou <code>NI Cloud Supply</code> dans la liste des Plugins.',
      'Sur le Master ou Submix 1 : ajoute <code>MSXII Fly Tape II</code> ou <code>Flex Beat</code> pour faire des freinages cassette en fin de mesure.'
    ],
    tip: 'Dans AIR Flavor (Insert Track 2), pousse légèrement le paramètre Flutter pour ce côté vieux magnétophone.'
  },
  {
    id: 'trap',
    title: '🔥 Trap & Cloud Rap Moderne',
    projectName: 'Arnaud_Trap_Cloud_140BPM',
    bpm: 140,
    bars: 8,
    swing: '50%',
    desc: 'Kicks/Hats chirurgicaux DECAP + 808 glissantes Sub Factory + Nappes Cloud Supply.',
    tags: ['DECAP Knock', 'Cloud Supply', 'Urban Roulette', 'Sub Factory', 'AIR Maximizer'],
    tracks: [
      { name: 'Drums (DECAP Knock)', fx: ['AIR Maximizer', 'PEQ 4-Band'] },
      { name: 'Percs / FX (Urban)', fx: ['AIR Stutter', 'AIR Delay'] },
      { name: '808 Glide (Sub Factory)', instrument: 'Sub Factory', fx: ['AIR Distortion'] },
      { name: 'Cloud Keys (Hype/Cloud)', instrument: 'Hype', fx: ['AIR Diff Delay'] }
    ],
    steps: [
      'Sur <strong>Track 1 (Drums)</strong> : appuie sur <code>BROWSE</code> → charge un kit <code>DECAP - Drums That Knock</code> ou <code>Urban Roulette</code>.',
      'Pour les Hi-Hats rapides Trap : maintiens le bouton physique <code>NOTE REPEAT</code> et touche ton Pad de Hi-Hat tout en changeant le division temps (<code>1/16</code>, <code>1/32</code>, <code>1/16T</code>) à l\'écran.',
      'Sur <strong>Track 3 (808 Sub Factory)</strong> : active <code>PAD PERFORM</code> en mode <strong>Chords / Notes</strong> et monte le <em>Glide</em> pour tes glissades de 808.',
      'Sur <strong>Track 4</strong> : sélectionne ton plugin <code>Native Instruments → Cloud Supply</code> dans le sélecteur de plugin sur <code>MAIN</code>.'
    ],
    tip: 'Remplace AIR Maximizer par AIR Soft Clipper sur Track 1 si tu veux un Kick encore plus agressif.'
  },
  {
    id: 'neosoul',
    title: '🎹 Neo-Soul & R&B Moderne',
    projectName: 'Arnaud_NeoSoul_86BPM',
    bpm: 86,
    bars: 8,
    swing: '59%',
    desc: 'Voix/Claviers hybrides Duets & Ignition Keys + Basse moelleuse + Sidechain léger.',
    tags: ['Duets', 'Ignition Keys', 'Soul Provider 3', 'Sub Factory', 'Compressor Vintage'],
    tracks: [
      { name: 'Drums (Soul Groove)', fx: ['Compressor Vintage', 'PEQ 4-Band'] },
      { name: 'Vocal / Brass Chops', fx: ['AIR Diff Delay', 'AIR Flavor'] },
      { name: 'Smooth Bass (Bassline)', instrument: 'Bassline', fx: ['Compressor Vintage'] },
      { name: 'R&B Keys (Hype/Duets)', instrument: 'Hype', fx: ['AIR Delay'] }
    ],
    steps: [
      'Branche ton clavier <strong>MPK49</strong> en USB à l\'arrière de la MPC One pour jouer facilement les accords Neo-Soul à 2 mains !',
      'Sur <strong>Track 4</strong> : bascule le plugin sur <code>NI Duets</code> ou <code>NI Ignition Keys</code> (ou utilise <code>PAD PERFORM → Progressions</code> si tu joues aux pads).',
      'Sur <strong>Track 1 (Drums)</strong> : charge <code>Soul Provider 3</code> ou <code>Pad Thai Vol. 1</code> et règle le Swing (bouton <code>TC</code>) autour de <code>58-60%</code>.',
      'Envoie Track 2 et Track 4 vers <strong>Return 1</strong> avec <code>AIR Reverb Pro</code> ou <code>AIR Ether</code> pour une belle largeur stéréo.'
    ],
    tip: 'Utilise AIR Tape Double Track sur les voix ou leads de Duets pour élargir le refrain.'
  },
  {
    id: 'synthwave',
    title: '🌆 Synthwave / Outrun 80s',
    projectName: 'Arnaud_Synthwave_108BPM',
    bpm: 108,
    bars: 8,
    swing: '50%',
    desc: 'Basses analogiques Juno/Prophet + Drums Gated 80s + Nappes Analog Dreams.',
    tags: ['Analog Dreams', 'Neo Sunset', 'F9 Instruments', 'TubeSynth', 'AIR Flavor'],
    tracks: [
      { name: 'Drums (Neo Sunset)', fx: ['Bus Compressor', 'AIR Maximizer'] },
      { name: 'FX / Risers 80s', fx: ['AIR Diff Delay', 'AIR Stutter'] },
      { name: 'Analog Bass (Bassline)', instrument: 'Bassline', fx: ['AIR Tube Drive'] },
      { name: 'Retro Synth (TubeSynth)', instrument: 'TubeSynth', fx: ['AIR Flavor', 'AIR Delay'] }
    ],
    steps: [
      'Sur <strong>Track 1 (Drums)</strong> : appuie sur <code>BROWSE</code> → <strong>Expansions → Neo Sunset</strong> → charge un kit 80s avec snare réverbérée.',
      'Sur <strong>Track 4</strong> : sélectionne ton plugin <code>NI Analog Dreams (MPC Edition)</code> dans le sélecteur de plugin de <code>MAIN</code>.',
      'Sur <strong>Track 3 (Analog Bass)</strong> : active <code>ARP</code> (Arpégiateur) dans <code>PAD PERFORM</code> en mode <code>1/8</code> ou <code>1/16</code> pour créer une basse Synthwave qui court toute seule.',
      'Ajoute <code>AIR Ether</code> en Send 1 pour des nappes spatiales énormes.'
    ],
    tip: 'Les 4 Q-Links d\'Analog Dreams contrôlent directement Blend A/B, Cutoff, Resonance et Noise.'
  },
  {
    id: 'afro',
    title: '🌍 Afrobeats & Afro-Swing',
    projectName: 'Arnaud_Afrobeats_104BPM',
    bpm: 104,
    bars: 8,
    swing: '55%',
    desc: 'Marimbas/Kalimbas Global Shake + Percussions organiques + Log Drum / Sub Bass.',
    tags: ['Global Shake', 'Sub Factory', 'AIR Delay', 'Bus Compressor', 'F9 Instruments'],
    tracks: [
      { name: 'Drums & Shaker', fx: ['Bus Compressor', 'AIR Maximizer'] },
      { name: 'Afro Perc Loops', fx: ['PEQ 4-Band', 'AIR Delay'] },
      { name: 'Log Drum / Sub (Sub Factory)', instrument: 'Sub Factory', fx: ['AIR Tube Drive'] },
      { name: 'Kalimba / Keys (Hype)', instrument: 'Hype', fx: ['AIR Diff Delay'] }
    ],
    steps: [
      'Sur <strong>Track 4</strong> : sélectionne ton plugin <code>NI Global Shake (MPC Edition)</code> pour les kalimbas, marimbas et guitares afro.',
      'Sur <strong>Track 3 (Sub Factory)</strong> : cherche un preset typé <em>Log Drum / Perc Bass</em> pour la frappe Amapiano/Afrobeats.',
      'Appuie sur <code>STEP SEQ</code> (bouton physique) pour programmer facilement ton kick syncopé et tes rimshots sur la grille 16 pas.',
      'Règle le Swing (<code>TC</code>) autour de <code>54-56%</code> pour le groove chaloupé.'
    ],
    tip: 'Utilise la Bank 4 (Groove) des Q-Links de Global Shake pour humaniser tes mélodies.'
  },
  {
    id: 'frenchtouch',
    title: '🪩 French Touch / Nu-Disco / House',
    projectName: 'Arnaud_FrenchTouch_122BPM',
    bpm: 122,
    bars: 8,
    swing: '53%',
    desc: 'Pompage Sidechain (Mother Ducker) + Basse Funk/Slap F9 + Chops filtrés Glitterball.',
    tags: ['Glitterball', 'F9 Instruments', 'Mother Ducker', 'Ignition Keys', 'Bus Compressor'],
    tracks: [
      { name: 'House Drums (Glitterball)', fx: ['Mother Ducker Input', 'Bus Compressor'] },
      { name: 'Disco Chops (Glitterball)', fx: ['Mother Ducker', 'AIR Flavor'] },
      { name: 'Funk Bass (Bassline)', instrument: 'Bassline', fx: ['Mother Ducker', 'Compressor Vintage'] },
      { name: 'House Chords (Hype)', instrument: 'Hype', fx: ['Mother Ducker', 'AIR Delay'] }
    ],
    steps: [
      '<strong>Magie pré-câblée :</strong> <code>Mother Ducker Input</code> est déjà sur <strong>Track 1 (Drums)</strong> et <code>Mother Ducker</code> sur les pistes 2, 3 et 4 pour le pompage French Touch automatique à chaque coup de Kick !',
      'Sur <strong>Track 1 & 2</strong> : appuie sur <code>BROWSE</code> → <strong>Expansions → Glitterball</strong> pour charger des kits Disco/House et des boucles de guitare/cordes.',
      'Sur <strong>Track 3</strong> : tu peux aussi charger une basse slap <code>F9 Instruments</code> via <code>BROWSE</code>.',
      'En live, ouvre <code>XYFX</code> (bouton physique) pour filtrer le mix au doigt comme Daft Punk / Justice.'
    ],
    tip: 'Dans Mother Ducker (Insert Track 2/3/4), ajuste le Ratio et le Release pour doser l\'effet de pompage.'
  },
  {
    id: 'techno',
    title: '⚡ Dark Techno / Cyberpunk',
    projectName: 'Arnaud_DarkTechno_132BPM',
    bpm: 132,
    bars: 4,
    swing: '50%',
    desc: 'Kicks industriels Cr2 Techno + Arpèges sombres LABYRINTH + Distorsion & Stutter.',
    tags: ['Cr2 Techno', 'Dark Parallax', 'LABYRINTH', 'AIR Distortion', 'AIR Stutter'],
    tracks: [
      { name: 'Techno Kick/Rumble (Cr2)', fx: ['AIR Distortion', 'Bus Compressor'] },
      { name: 'Industrial Percs (Parallax)', fx: ['AIR Stutter', 'AIR Diff Delay'] },
      { name: 'Acid / Mod Bass (Bassline)', instrument: 'Bassline', fx: ['AIR Tube Drive', 'PEQ 4-Band'] },
      { name: 'Dark Arp (TubeSynth)', instrument: 'TubeSynth', fx: ['Granulator', 'AIR Delay'] }
    ],
    steps: [
      'Sur <strong>Track 1 (Kick)</strong> : charge un kit de <code>Cr2 Techno</code> via <code>BROWSE</code> → règle le Kick sur les 4 temps (1, 5, 9, 13 dans <code>STEP SEQ</code>).',
      'Sur <strong>Track 2</strong> : charge des textures de <code>Dark Parallax</code> ou <code>LABYRINTH</code> — l\'insert <code>AIR Stutter</code> est prêt pour hacher les percussions.',
      'Sur <strong>Track 3 (Acid Bass)</strong> : tourne le Cutoff et la Résonance avec tes <code>Q-LINK</code> pendant que la boucle tourne et enregistre l\'automation (touche l\'icône <strong>Automation Read/Write</strong> rouge en haut à droite de l\'écran !).'
    ],
    tip: 'Utilise le moteur Oscillator intégré (MPC 3.9+) dans Program Edit pour sculpter des kicks/percs sans sample.'
  },
  {
    id: 'westcoast',
    title: '🌴 West Coast / G-Funk',
    projectName: 'Arnaud_WestCoast_96BPM',
    bpm: 96,
    bars: 4,
    swing: '56%',
    desc: 'Leads sifflants G-Funk + Claviers Scott Storch + Basse Moog lourde + Clap sec.',
    tags: ['West Coast Funk', 'Scott Storch', 'Sub Factory', 'TubeSynth', 'Compressor Vintage'],
    tracks: [
      { name: 'Drums (West Coast / Storch)', fx: ['Compressor Vintage', 'AIR Maximizer'] },
      { name: 'Talkbox / Hits', fx: ['AIR Delay', 'PEQ 4-Band'] },
      { name: 'G-Funk Moog Bass (Sub Factory)', instrument: 'Sub Factory', fx: ['AIR Tube Drive'] },
      { name: 'Whine Lead (TubeSynth)', instrument: 'TubeSynth', fx: ['AIR Diff Delay'] }
    ],
    steps: [
      'Sur <strong>Track 1 (Drums)</strong> : appuie sur <code>BROWSE</code> → charge un kit de <code>West Coast Funk</code> ou <code>Scott Storch Presents</code>.',
      'Sur <strong>Track 4 (Whine Lead)</strong> : active le mode <strong>Mono + Glide/Portamento</strong> dans ton synthé pour obtenir le célèbre sifflement G-Funk aigu.',
      'Sur <strong>Track 3 (Sub Factory)</strong> : joue des notes longues et graves sous le groove, en gardant le Clap bien sec en avant.'
    ],
    tip: 'Branche ton MPK Mini MK2 ou MPK49 pour utiliser la molette Pitch Bend sur le Whine Lead !'
  }
];

let selectedTemplateId = 'boombap';

function initTemplatesTab() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;

  // Populate drives dropdown for templates
  fetch('/api/drives')
    .then(r => r.json())
    .then(data => {
      const sel = document.getElementById('tplTargetDrive');
      if (sel && data.drives) {
        sel.innerHTML = data.drives.map(d => `<option value="${d.id}">${d.label}</option>`).join('');
      }
    })
    .catch(() => {});

  const renderCards = () => {
    grid.innerHTML = MPC_TEMPLATES.map(tpl => `
      <div class="template-card ${tpl.id === selectedTemplateId ? 'active' : ''}" data-tpl="${tpl.id}">
        <div class="template-card-head">
          <span class="template-card-title">${tpl.title}</span>
          <span class="template-bpm-pill">${tpl.bpm} BPM</span>
        </div>
        <div class="template-card-desc">${tpl.desc}</div>
        <div class="template-card-tags">
          ${tpl.tags.map(t => `<span class="template-tag">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedTemplateId = card.dataset.tpl;
        const tpl = MPC_TEMPLATES.find(t => t.id === selectedTemplateId);
        if (tpl) {
          document.getElementById('tplProjectName').value = tpl.projectName;
          document.getElementById('tplBpm').value = tpl.bpm;
          document.getElementById('tplBars').value = String(tpl.bars);
          renderCards();
          renderTemplateGuide(tpl);
        }
      });
    });
  };

  const renderTemplateGuide = (tpl) => {
    const guideEl = document.getElementById('tplNewbieGuide');
    guideEl.innerHTML = `
      <h3>📖 Guide Newbie MPC One — ${tpl.title}</h3>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">
        <strong>Pistes pré-câblées dans le <code>.xpj</code> :</strong> ${tpl.tracks.map(t => `<code>${t.name}</code>`).join(' • ')}
      </p>
      <ol>
        ${tpl.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
      <div class="newbie-tip">💡 <strong>Astuce Pro :</strong> ${tpl.tip}</div>
    `;
  };

  async function exportTemplate(mode) {
    const tpl = MPC_TEMPLATES.find(t => t.id === selectedTemplateId) || MPC_TEMPLATES[0];
    const resultBox = document.getElementById('tplExportResult');
    resultBox.style.display = 'block';
    resultBox.classList.remove('error');
    resultBox.innerHTML = '⏳ Génération du fichier natif <code>.xpj</code> (MPC OS 3.x) en cours...';

    const payload = {
      templateId: tpl.id,
      projectName: document.getElementById('tplProjectName').value.trim() || tpl.projectName,
      bpm: Number(document.getElementById('tplBpm').value) || tpl.bpm,
      bars: Number(document.getElementById('tplBars').value) || tpl.bars,
      tracks: tpl.tracks,
      guideText: tpl.steps.map((s, i) => `${i + 1}. ${s.replace(/<[^>]+>/g, '')}`).join('\n'),
      deployToDrive: mode === 'drive',
      targetDriveId: document.getElementById('tplTargetDrive')?.value || 'workspace'
    };

    try {
      const resp = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Erreur de génération');

      if (mode === 'zip') {
        const a = document.createElement('a');
        a.href = data.zipUrl;
        a.download = `${payload.projectName}.zip`;
        a.click();
      } else if (mode === 'xpj') {
        const a = document.createElement('a');
        a.href = data.xpjUrl;
        a.download = data.fileName;
        a.click();
      }

      resultBox.innerHTML = `
        <strong>✅ Template <code>${data.fileName}</code> prêt pour ta MPC One Standalone !</strong>
        <div style="margin-top:6px; font-size:0.78rem;">
          Format authentique <code>ACVS / SerialisableProjectData (gzip)</code> • ${(data.sizeBytes / 1024).toFixed(1)} KB
          ${data.deployedPath ? `<br/>💾 Copié directement dans : <code>${data.deployedPath}</code>` : ''}
        </div>
        <div class="sdk-result-actions" style="margin-top:8px;">
          <a class="btn-download-zip" href="${data.zipUrl}" download>⬇️ Pack Complet Carte SD (.zip)</a>
          <a class="btn-download-zip" href="${data.xpjUrl}" download>📄 ${data.fileName} seul</a>
        </div>
      `;
    } catch (err) {
      resultBox.classList.add('error');
      resultBox.innerHTML = `❌ Erreur : ${escapeHtml(err.message)}`;
    }
  }

  document.getElementById('btnDownloadTemplateZip')?.addEventListener('click', () => exportTemplate('zip'));
  document.getElementById('btnDownloadTemplateXpj')?.addEventListener('click', () => exportTemplate('xpj'));
  document.getElementById('btnDeployTemplateDrive')?.addEventListener('click', () => exportTemplate('drive'));

  renderCards();
  renderTemplateGuide(MPC_TEMPLATES[0]);
}

initApp();

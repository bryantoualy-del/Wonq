/* RPG Connect v1 — transport-agnostic session bridge for Wonq.
   Injected inside Wonq's main IIFE so it can read the canonical companion state.
   Offline-first: the companion keeps working with no Cockpit/server. */
{
  const RPG_PROTOCOL = 'rpg-connect';
  const RPG_VERSION = '1.0';
  const RPG_CHARACTER = Object.freeze({
    id: 'wonq',
    name: 'Wonq',
    kind: 'pc',
    system: 'dnd5e',
    companion: 'wonq-companion',
    companionVersion: '2026.09.24'
  });
  const RPG_CONFIG_KEY = 'wonq-rpg-connect-v1';
  const RPG_EVENTS_KEY = RPG_CONFIG_KEY + '-events';
  const RPG_MAX_EVENTS = 120;
  const RPG_CAPABILITIES = [
    'companion.hello',
    'state.snapshot',
    'state.patch',
    'action.resolved',
    'combat.started',
    'turn.ended',
    'rest.completed',
    'concentration.changed',
    'hp.changed',
    'resource.changed',
    'feature.used',
    'session.resync',
    'state.request',
    'ping'
  ];

  let rpgSocket = null;
  let rpgChannel = null;
  let rpgStatus = 'offline';
  let rpgPeerSeenAt = 0;
  let rpgListeners = new Map();

  function rpgClone(value){
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }
  function rpgId(){
    try {
      if (crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch(e) {}
    return 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
  }
  function rpgLoadConfig(){
    try {
      const raw = JSON.parse(localStorage.getItem(RPG_CONFIG_KEY) || '{}');
      return {
        sessionCode: String(raw.sessionCode || '').trim().toUpperCase().slice(0,24),
        endpoint: String(raw.endpoint || '').trim(),
        autoConnect: !!raw.autoConnect
      };
    } catch(e) {
      return {sessionCode:'', endpoint:'', autoConnect:false};
    }
  }
  let rpgConfig = rpgLoadConfig();

  function rpgSaveConfig(){
    localStorage.setItem(RPG_CONFIG_KEY, JSON.stringify(rpgConfig));
  }
  function rpgState(){
    return {
      characterId: RPG_CHARACTER.id,
      hp: {current:S.hp, max:59, temp:S.thp},
      combat: {
        id:S.combat,
        turn:S.turn,
        round:S.round,
        turnDamage:S.turnDamage
      },
      economy: rpgClone(S.econ),
      resources: {
        inspiration:S.insp,
        dodge:S.dodge,
        memory:S.memory,
        mistyFree:S.mistyFree,
        commandFree:S.commandFree,
        slots:rpgClone(S.slots)
      },
      concentration:S.concentration || null,
      tale:S.tale || null,
      taleChoices:rpgClone(S.taleChoices),
      cortege:!!S.cortege,
      conditions:rpgClone(S.conditions || []),
      sessionSpell:S.sessionSpell || '',
      updatedAt:new Date().toISOString()
    };
  }
  function rpgComparableState(){
    const s = rpgState();
    delete s.updatedAt;
    return s;
  }
  function rpgDiff(before, after, prefix, out){
    prefix = prefix || '';
    out = out || [];
    if (before === after) return out;
    const beforeObj = before && typeof before === 'object';
    const afterObj = after && typeof after === 'object';
    if (!beforeObj || !afterObj || Array.isArray(before) || Array.isArray(after)) {
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        out.push({path:prefix, previous:rpgClone(before), value:rpgClone(after)});
      }
      return out;
    }
    const keys = new Set(Object.keys(before).concat(Object.keys(after)));
    keys.forEach(function(key){
      const path = prefix ? prefix + '.' + key : key;
      rpgDiff(before[key], after[key], path, out);
    });
    return out;
  }
  function rpgEnvelope(type, payload){
    return {
      protocol:RPG_PROTOCOL,
      version:RPG_VERSION,
      id:rpgId(),
      timestamp:new Date().toISOString(),
      session:{code:rpgConfig.sessionCode || null},
      actor:{id:RPG_CHARACTER.id, name:RPG_CHARACTER.name, kind:RPG_CHARACTER.kind},
      source:{
        app:RPG_CHARACTER.companion,
        appVersion:RPG_CHARACTER.companionVersion,
        system:RPG_CHARACTER.system
      },
      type:type,
      payload:rpgClone(payload || {})
    };
  }
  function rpgLoadEventLog(){
    try {
      const data = JSON.parse(localStorage.getItem(RPG_EVENTS_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch(e) {
      return [];
    }
  }
  function rpgLogEvent(evt, direction){
    const list = rpgLoadEventLog();
    list.push({
      id:evt.id,
      timestamp:evt.timestamp || new Date().toISOString(),
      direction:direction || 'out',
      type:evt.type,
      session:evt.session && evt.session.code || null
    });
    localStorage.setItem(RPG_EVENTS_KEY, JSON.stringify(list.slice(-RPG_MAX_EVENTS)));
    rpgRenderEventLog();
  }
  function rpgDispatchLocal(evt){
    const typed = rpgListeners.get(evt.type) || [];
    const all = rpgListeners.get('*') || [];
    typed.concat(all).forEach(function(fn){
      try { fn(evt); } catch(e) {}
    });
    try {
      window.dispatchEvent(new CustomEvent('rpg-connect:event', {detail:evt}));
    } catch(e) {}
  }
  function rpgSendEnvelope(evt, options){
    options = options || {};
    if (!options.skipLog) rpgLogEvent(evt, 'out');
    rpgDispatchLocal(evt);
    if (rpgConfig.sessionCode && rpgChannel) {
      try { rpgChannel.postMessage(evt); } catch(e) {}
    }
    if (rpgSocket && rpgSocket.readyState === WebSocket.OPEN) {
      try { rpgSocket.send(JSON.stringify(evt)); } catch(e) {}
    }
    return evt;
  }
  function rpgEmit(type, payload){
    return rpgSendEnvelope(rpgEnvelope(type, payload));
  }

  function rpgHello(){
    return rpgEmit('companion.hello', {
      character:rpgClone(RPG_CHARACTER),
      protocolVersion:RPG_VERSION,
      capabilities:rpgClone(RPG_CAPABILITIES)
    });
  }
  function rpgResync(reason){
    rpgHello();
    rpgEmit('state.snapshot', {
      reason:reason || 'manual',
      state:rpgState()
    });
    rpgSetStatus(rpgSocket && rpgSocket.readyState === WebSocket.OPEN ? 'connected' : (rpgConfig.sessionCode ? 'local' : 'offline'));
  }

  function rpgClassify(title, text, type, before, after){
    if (title === 'Nouveau combat') return 'combat.started';
    if (title === 'Tour suivant') return 'turn.ended';
    if (title === 'Repos court' || title === 'Repos long') return 'rest.completed';
    if (title === 'Dégâts reçus' || title === 'Soins reçus' || before.hp.current !== after.hp.current || before.hp.temp !== after.hp.temp) return 'hp.changed';
    if (title.indexOf('Concentration') === 0 || before.concentration !== after.concentration) return 'concentration.changed';
    if (title.indexOf('Inspiration bardique') === 0 || title.indexOf('Conte') >= 0 || title.indexOf('Cortège') >= 0 || title.indexOf('Séance de spiritisme') >= 0) return 'feature.used';
    if (JSON.stringify(before.resources) !== JSON.stringify(after.resources)) return 'resource.changed';
    return 'action.resolved';
  }

  let rpgLastState = rpgComparableState();
  const rpgBaseRecord = record;
  record = function(title, text, type, fxType){
    const before = rpgLastState;
    rpgBaseRecord(title, text, type, fxType === undefined ? type : fxType);
    const after = rpgComparableState();
    const changes = rpgDiff(before, after);
    const semanticType = rpgClassify(String(title || ''), String(text || ''), String(type || ''), before, after);
    rpgEmit(semanticType, {
      title:String(title || ''),
      text:String(text || ''),
      journalType:String(type || ''),
      combat:{id:after.combat.id, round:after.combat.round, turn:after.combat.turn},
      changes:rpgClone(changes)
    });
    if (changes.length) {
      rpgEmit('state.patch', {
        baseCharacterId:RPG_CHARACTER.id,
        changes:rpgClone(changes),
        stateUpdatedAt:new Date().toISOString()
      });
    }
    rpgLastState = after;
  };

  function rpgValidIncoming(evt){
    return !!evt && evt.protocol === RPG_PROTOCOL && String(evt.version || '').split('.')[0] === RPG_VERSION.split('.')[0];
  }
  function rpgHandleIncoming(evt){
    if (!rpgValidIncoming(evt)) return;
    if (evt.id) {
      const recent = rpgLoadEventLog().some(function(x){ return x.id === evt.id && x.direction === 'in'; });
      if (recent) return;
    }
    const code = evt.session && evt.session.code;
    if (rpgConfig.sessionCode && code && String(code).toUpperCase() !== rpgConfig.sessionCode) return;
    rpgLogEvent(evt, 'in');
    rpgDispatchLocal(evt);
    rpgPeerSeenAt = Date.now();

    if (evt.type === 'state.request' || evt.type === 'session.resync') {
      rpgResync(evt.type);
      return;
    }
    if (evt.type === 'ping') {
      rpgEmit('pong', {replyTo:evt.id || null});
      return;
    }
    if (evt.type === 'cockpit.hello') {
      rpgSetStatus(rpgSocket && rpgSocket.readyState === WebSocket.OPEN ? 'connected' : 'session');
      return;
    }
    if (evt.type === 'turn.started') {
      const actorId = evt.payload && (evt.payload.actorId || evt.payload.characterId);
      if (actorId === RPG_CHARACTER.id) {
        try { showRibbon('Ton tour', 'Le Cockpit donne la main à Wonq.'); } catch(e) {}
      }
    }
  }

  function rpgCloseChannel(){
    if (rpgChannel) {
      try { rpgChannel.close(); } catch(e) {}
      rpgChannel = null;
    }
  }
  function rpgOpenChannel(){
    rpgCloseChannel();
    if (!rpgConfig.sessionCode || !('BroadcastChannel' in window)) return;
    try {
      rpgChannel = new BroadcastChannel('rpg-connect:' + rpgConfig.sessionCode);
      rpgChannel.onmessage = function(e){ rpgHandleIncoming(e.data); };
    } catch(e) {
      rpgChannel = null;
    }
  }

  function rpgDisconnect(options){
    options = options || {};
    if (rpgSocket) {
      try {
        rpgSocket.onopen = rpgSocket.onclose = rpgSocket.onerror = rpgSocket.onmessage = null;
        rpgSocket.close();
      } catch(e) {}
      rpgSocket = null;
    }
    if (!options.keepChannel) rpgCloseChannel();
    rpgSetStatus(rpgConfig.sessionCode && options.keepChannel ? 'local' : 'offline');
  }
  function rpgConnect(options){
    options = options || {};
    if (options.sessionCode != null) rpgConfig.sessionCode = String(options.sessionCode).trim().toUpperCase().slice(0,24);
    if (options.endpoint != null) rpgConfig.endpoint = String(options.endpoint).trim();
    if (options.autoConnect != null) rpgConfig.autoConnect = !!options.autoConnect;
    rpgSaveConfig();
    rpgOpenChannel();

    if (!rpgConfig.sessionCode) {
      rpgSetStatus('error', 'code session requis');
      return false;
    }

    if (!rpgConfig.endpoint) {
      rpgSetStatus('local');
      rpgResync('local-connect');
      return true;
    }

    rpgDisconnect({keepChannel:true});
    rpgSetStatus('connecting');
    try {
      rpgSocket = new WebSocket(rpgConfig.endpoint);
      rpgSocket.onopen = function(){
        rpgSetStatus('connected');
        rpgResync('socket-open');
      };
      rpgSocket.onmessage = function(e){
        try { rpgHandleIncoming(JSON.parse(e.data)); } catch(err) {}
      };
      rpgSocket.onerror = function(){
        rpgSetStatus('error', 'websocket');
      };
      rpgSocket.onclose = function(){
        rpgSocket = null;
        rpgSetStatus(rpgConfig.sessionCode ? 'local' : 'offline');
      };
      return true;
    } catch(e) {
      rpgSocket = null;
      rpgSetStatus('error', 'endpoint invalide');
      return false;
    }
  }

  function rpgSetStatus(status, detail){
    rpgStatus = status;
    const button = document.getElementById('rpgConnectStatus');
    const line = document.getElementById('rpgStatusLine');
    const labels = {
      offline:'RPG · hors ligne',
      local:'RPG · local',
      session:'RPG · session',
      connecting:'RPG · connexion…',
      connected:'RPG · connecté',
      error:'RPG · erreur'
    };
    if (button) {
      button.textContent = labels[status] || labels.offline;
      button.dataset.rpgStatus = status;
    }
    if (line) {
      const parts = [];
      parts.push(labels[status] || labels.offline);
      if (rpgConfig.sessionCode) parts.push('session ' + rpgConfig.sessionCode);
      if (detail) parts.push(detail);
      line.textContent = parts.join(' · ');
    }
  }

  function rpgRenderEventLog(){
    const root = document.getElementById('rpgEventLog');
    if (!root) return;
    const list = rpgLoadEventLog().slice(-8).reverse();
    if (!list.length) {
      root.innerHTML = '<div class="rpg-empty">Aucun événement RPG Connect.</div>';
      return;
    }
    root.innerHTML = list.map(function(e){
      const dir = e.direction === 'in' ? '←' : '→';
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '';
      return '<div class="rpg-log"><span>' + dir + '</span><b>' + rpgEsc(e.type) + '</b><small>' + rpgEsc(time) + '</small></div>';
    }).join('');
  }
  function rpgEsc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function rpgInstallUI(){
    const statebar = document.querySelector('.statebar');
    if (statebar && !document.getElementById('rpgConnectStatus')) {
      const status = document.createElement('button');
      status.id = 'rpgConnectStatus';
      status.className = 'state clickable';
      status.type = 'button';
      status.textContent = 'RPG · hors ligne';
      status.onclick = function(){ rpgOpenModal(); };
      statebar.appendChild(status);
    }

    if (document.getElementById('rpgConnectModal')) return;

    const style = document.createElement('style');
    style.textContent =
      '#rpgConnectModal{position:fixed;inset:0;z-index:160;background:#050507d9;display:grid;place-items:center;padding:14px}' +
      '#rpgConnectModal[hidden]{display:none}' +
      '#rpgConnectModal .rpg-box{width:min(620px,100%);max-height:88vh;overflow:auto;border:1px solid #6b5b53;border-radius:16px;background:linear-gradient(145deg,#171418,#0e0e10);box-shadow:0 24px 80px #000c;padding:16px}' +
      '#rpgConnectModal .rpg-head{display:flex;justify-content:space-between;align-items:center;gap:10px}' +
      '#rpgConnectModal h2{margin:0;color:#dec9e7}' +
      '#rpgConnectModal .rpg-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}' +
      '#rpgConnectModal label{display:grid;gap:5px;color:#c9bdad;font-size:.9rem}' +
      '#rpgConnectModal input[type=text],#rpgConnectModal input[type=url]{width:100%;box-sizing:border-box;background:#0c0a0d;color:#f5ead8;border:1px solid #514657;border-radius:9px;padding:10px}' +
      '#rpgConnectModal .rpg-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}' +
      '#rpgConnectModal button{min-height:40px}' +
      '#rpgConnectModal .rpg-help{color:#9f9588;font-size:.82rem;line-height:1.45;margin-top:8px}' +
      '#rpgConnectModal .rpg-log{display:grid;grid-template-columns:22px 1fr auto;gap:7px;align-items:center;padding:6px 0;border-top:1px solid #302a31}' +
      '#rpgConnectModal .rpg-log small{color:#8f877e}' +
      '#rpgConnectModal .rpg-empty{color:#8f877e;padding:9px 0}' +
      '#rpgConnectStatus[data-rpg-status="connected"],#rpgConnectStatus[data-rpg-status="session"]{border-color:#69a99b}' +
      '#rpgConnectStatus[data-rpg-status="error"]{border-color:#b55f56}' +
      '@media(max-width:520px){#rpgConnectModal{padding:7px}#rpgConnectModal .rpg-box{padding:13px;border-radius:13px}}';
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'rpgConnectModal';
    modal.hidden = true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML =
      '<div class="rpg-box">' +
        '<div class="rpg-head"><div><div class="eyebrow">RPG Connect v1</div><h2>Session connectée</h2></div><button id="rpgClose" class="ability" type="button">Fermer</button></div>' +
        '<div id="rpgStatusLine" class="rpg-help"></div>' +
        '<div class="rpg-grid">' +
          '<label>Code de session<input id="rpgSessionCode" type="text" maxlength="24" autocomplete="off" placeholder="A7K9"></label>' +
          '<label>Endpoint WebSocket <input id="rpgEndpoint" type="url" inputmode="url" autocomplete="off" placeholder="wss://… (facultatif pour le test local)"></label>' +
          '<label style="display:flex;grid-template-columns:auto 1fr;align-items:center"><input id="rpgAutoConnect" type="checkbox"> Reconnexion automatique au chargement</label>' +
        '</div>' +
        '<div class="rpg-actions">' +
          '<button id="rpgConnect" class="primary teal" type="button">Connecter</button>' +
          '<button id="rpgResync" class="ability" type="button">↻ Resynchroniser</button>' +
          '<button id="rpgDisconnect" class="ability" type="button">Déconnecter</button>' +
        '</div>' +
        '<div class="rpg-help">Sans endpoint, le mode local utilise BroadcastChannel pour tester Wonq et le Cockpit dans deux onglets du même navigateur. Pour plusieurs appareils, utilisez un relais WebSocket partagé. Une resynchronisation envoie <b>companion.hello</b> puis <b>state.snapshot</b>.</div>' +
        '<h3 style="margin:16px 0 4px">Derniers événements</h3><div id="rpgEventLog"></div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('rpgClose').onclick = rpgCloseModal;
    document.getElementById('rpgConnect').onclick = function(){
      rpgReadForm();
      rpgConnect(rpgConfig);
    };
    document.getElementById('rpgResync').onclick = function(){
      rpgReadForm();
      rpgOpenChannel();
      rpgResync('manual-button');
    };
    document.getElementById('rpgDisconnect').onclick = function(){
      rpgDisconnect();
    };
    modal.addEventListener('click', function(e){
      if (e.target === modal) rpgCloseModal();
    });
    rpgFillForm();
    rpgRenderEventLog();
  }
  function rpgReadForm(){
    const session = document.getElementById('rpgSessionCode');
    const endpoint = document.getElementById('rpgEndpoint');
    const auto = document.getElementById('rpgAutoConnect');
    rpgConfig.sessionCode = session ? String(session.value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,24) : rpgConfig.sessionCode;
    rpgConfig.endpoint = endpoint ? String(endpoint.value || '').trim() : rpgConfig.endpoint;
    rpgConfig.autoConnect = auto ? !!auto.checked : rpgConfig.autoConnect;
    rpgSaveConfig();
    rpgFillForm();
  }
  function rpgFillForm(){
    const session = document.getElementById('rpgSessionCode');
    const endpoint = document.getElementById('rpgEndpoint');
    const auto = document.getElementById('rpgAutoConnect');
    if (session) session.value = rpgConfig.sessionCode;
    if (endpoint) endpoint.value = rpgConfig.endpoint;
    if (auto) auto.checked = rpgConfig.autoConnect;
  }
  function rpgOpenModal(){
    rpgFillForm();
    rpgRenderEventLog();
    rpgSetStatus(rpgStatus);
    const modal = document.getElementById('rpgConnectModal');
    if (modal) modal.hidden = false;
  }
  function rpgCloseModal(){
    const modal = document.getElementById('rpgConnectModal');
    if (modal) modal.hidden = true;
  }

  window.RPGConnect = Object.freeze({
    protocol:RPG_PROTOCOL,
    version:RPG_VERSION,
    character:rpgClone(RPG_CHARACTER),
    capabilities:rpgClone(RPG_CAPABILITIES),
    connect:rpgConnect,
    disconnect:rpgDisconnect,
    resync:rpgResync,
    emit:rpgEmit,
    getState:function(){ return rpgState(); },
    getConfig:function(){ return rpgClone(rpgConfig); },
    on:function(type, fn){
      if (typeof fn !== 'function') return function(){};
      const list = rpgListeners.get(type) || [];
      list.push(fn);
      rpgListeners.set(type, list);
      return function(){
        const now = rpgListeners.get(type) || [];
        rpgListeners.set(type, now.filter(function(x){ return x !== fn; }));
      };
    }
  });

  rpgInstallUI();
  rpgOpenChannel();
  rpgSetStatus(rpgConfig.sessionCode ? 'local' : 'offline');
  if (rpgConfig.autoConnect && rpgConfig.sessionCode) {
    setTimeout(function(){ rpgConnect(rpgConfig); }, 250);
  }
}

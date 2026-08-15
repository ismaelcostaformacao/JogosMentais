/* ============ ESTADO ============ */
const S = {
  diff: 1, simDiff: 2, game: null, q: 0, totalQ: 10,
  score: 0, correct: 0, time: 0, timer: null, start: 0,
  sel: null, ans: null, sim: false, simI: 0, simStart: 0,
  simTimer: null, simTotalScore: 0, simGameScores: [],
  reactTime: null, reactReady: false, reactDone: false,
  reactStart: 0, reactTO: null, memSeq: [], memCols: [], memUser: [],
  memTimeouts: [], memDone: false, memPhase: 'show', memIndex: 0, ended: false, psyProfile: null
};
const GAMES = [
  { id: 'fig', n: 'Sequências de Figuras', i: '🔷', c: '#4f46e5', d: 'Identifica o próximo padrão', t: 60 },
  { id: 'num', n: 'Sequências Numéricas', i: '🔢', c: '#10b981', d: 'Descobre o próximo número', t: 60 },
  { id: 'mem', n: 'Memória de Cores', i: '🎨', c: '#f59e0b', d: 'Memoriza e reproduz sequências', t: 45 },
  { id: 'rea', n: 'Tempo de Reação', i: '⚡', c: '#ef4444', d: 'Clica o mais rápido possível', t: 30 },
  { id: 'mat', n: 'Cálculo Mental', i: '🧮', c: '#8b5cf6', d: 'Resolve operações rápidas', t: 60 },
  { id: 'log', n: 'Padrões Lógicos', i: '🧩', c: '#06b6d4', d: 'Encontra a relação lógica', t: 75 },
  { id: 'ana', n: 'Analogias Verbais', i: '💬', c: '#ec4899', d: 'Completa a analogia A:B :: C:?', t: 60 },
  { id: 'rot', n: 'Rotação 2D', i: '🔄', c: '#14b8a6', d: 'Identifica a rotação correta', t: 75 },
  { id: 'dom', n: 'Dominós', i: '🀃', c: '#f97316', d: 'Completa a sequência de dominó', t: 60 },
  { id: 'tel', n: 'Rotação 3D', i:'🏠', c:'#84cc16', d:'Da vista de frente à planta do telhado', t:75 },
  { id: 'psy', n: 'Perfil Psicológico', i: '🧠', c: '#8b5cf6', d: 'Descobre o teu perfil de personalidade', t: 120 }
];

// Jogos incluídos na Simulação de Exame (exclui o Perfil Psicológico)
const SIM_GAMES = GAMES.filter(g => g.id !== 'psy');

const ACHS = [
  { id: 'g1', n: 'Primeiro Passo', d: 'Completa 1 jogo', i: '🎯', f: s => s.tg >= 1 },
  { id: 'g10', n: 'Dedicado', d: 'Completa 10 jogos', i: '⭐', f: s => s.tg >= 10 },
  { id: 'g50', n: 'Veterano', d: 'Completa 50 jogos', i: '🏅', f: s => s.tg >= 50 },
  { id: 's1k', n: 'Mil Pontos', d: '1000 pontos totais', i: '💯', f: s => s.ts >= 1000 },
  { id: 's5k', n: 'Mestre Mental', d: '5000 pontos totais', i: '👑', f: s => s.ts >= 5000 },
  { id: 'st5', n: 'Em Chamas', d: '5 respostas certas seguidas', i: '🔥', f: s => s.bs >= 5 },
  { id: 'st10', n: 'Imparável', d: '10 respostas certas seguidas', i: '💎', f: s => s.bs >= 10 },
  { id: 'perf', n: 'Perfeição', d: '100% de precisão num jogo', i: '✨', f: s => s.pg >= 1 },
  { id: 'hard', n: 'Nível Difícil', d: 'Completa jogo no nível difícil', i: '🏆', f: s => s.hg >= 1 },
  { id: 'sim', n: 'Exame Completo', d: 'Completa uma simulação', i: '📝', f: s => s.sm >= 1 },
  { id: 'sim5', n: 'Examinador', d: 'Completa 5 simulações', i: '🎓', f: s => s.sm >= 5 },
  { id:'all',   n:'Polivalente',     d:'Joga todos os 10 tipos de jogos', i:'🎪', f: s => s.ug >= 10 },
  { id: 'spd', n: 'Velocista', d: 'Reação abaixo de 300ms', i: '⚡', f: s => s.br < 300 && s.br > 0 },
  { id: 'daily', n: 'Treino Diário', d: '7 dias seguidos de treino', i: '📅', f: s => s.streak >= 7 }
];
/* ============ STORAGE ============ */
function loadD() {
  try {
    const d = JSON.parse(localStorage.getItem('pt') || '{}');
    return {
      ts: d.ts || 0, tg: d.tg || 0, h: d.h || [], a: d.a || [],
      bs: d.bs || 0, cs: d.cs || 0, pg: d.pg || 0, hg: d.hg || 0,
      sm: d.sm || 0, ug: d.ug || 0, gp: d.gp || [], br: d.br || 9999,
      th: d.th || 'light', simHistory: d.simHistory || [],
      lastPlay: d.lastPlay || null, streak: d.streak || 0,
      notifTime: d.notifTime || '09:00', notifEnabled: d.notifEnabled || false,
      psyProfiles: d.psyProfiles || []
    };
  } catch (e) {
    return { ts: 0, tg: 0, h: [], a: [], bs: 0, cs: 0, pg: 0, hg: 0, sm: 0, ug: 0, gp: [], br: 9999, th: 'light', simHistory: [], lastPlay: null, streak: 0, notifTime: '09:00', notifEnabled: false, psyProfiles: [] };
  }
}
function saveD() { try { localStorage.setItem('pt', JSON.stringify(D)); } catch (e) { } }

let D = loadD();

/* ============ NOTIFICAÇÕES ============ */
let notifTO = null;
async function requestNotifPermission() {
  if (!('Notification' in window)) { toast('⚠️ O teu browser não suporta notificações', 'aw'); return false; }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try { const p = await Notification.requestPermission(); return p === 'granted'; } catch (e) { return false; }
  }
  return false;
}
async function enableNotifications() {
  const granted = await requestNotifPermission();
  if (granted) {
    S.notifEnabled = true; D.notifEnabled = true; saveD();
    scheduleDailyNotif();
    toast('🔔 Notificações ativadas!', 'ok');
  } else {
    toast('⚠️ Permissão negada', 'aw');
    const t = document.getElementById('notifToggle'); if (t) t.checked = false;
    const st = document.getElementById('notifSettings'); if (st) st.style.display = 'none';
  }
}
function disableNotifications() {
  S.notifEnabled = false; D.notifEnabled = false; saveD();
  clearTimeout(notifTO);
  toast('🔕 Notificações desativadas', 'ok');
}
function scheduleDailyNotif() {
  clearTimeout(notifTO);
  if (!D.notifEnabled || !('Notification' in window)) return;
  const now = new Date();
  const parts = (D.notifTime || '09:00').split(':');
  const target = new Date();
  target.setHours(parseInt(parts[0]) || 9, parseInt(parts[1]) || 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  notifTO = setTimeout(() => {
    showNotif('🧠 PsicoTreino PT', 'Está na hora de treinar a mente! Mantém a tua sequência 🔥');
    scheduleDailyNotif();
  }, target - now);
}
function showNotif(title, body) {
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body }); } catch (e) { }
}
function toggleNotif() {
  const toggle = document.getElementById('notifToggle');
  if (toggle.checked) {
    document.getElementById('notifSettings').style.display = 'block';
    enableNotifications();
  } else {
    disableNotifications();
    document.getElementById('notifSettings').style.display = 'none';
  }
}
function updateNotifTime() {
  const time = document.getElementById('notifTime').value;
  D.notifTime = time; saveD();
  if (D.notifEnabled) { scheduleDailyNotif(); toast('⏰ Lembrete agendado para ' + time, 'ok'); }
}
function renderNotifSettings() {
  const toggle = document.getElementById('notifToggle'); if (!toggle) return;
  const settings = document.getElementById('notifSettings');
  const timeInput = document.getElementById('notifTime');
  const streakEl = document.getElementById('notifStreak');
  const streakBar = document.getElementById('notifStreakBar');
  toggle.checked = D.notifEnabled;
  if (timeInput) timeInput.value = D.notifTime;
  if (settings) settings.style.display = D.notifEnabled ? 'block' : 'none';
  if (streakEl) streakEl.textContent = (D.streak || 0) + ' dias ' + (D.streak > 0 ? '🔥' : '');
  if (streakBar) streakBar.style.width = Math.min((D.streak || 0) / 7 * 100, 100) + '%';
}
/* ============ NAVEGAÇÃO ============ */
function go(p) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    let pg = document.getElementById('p-' + p);
    if (!pg) { p = 'home'; pg = document.getElementById('p-home'); }  // ✅ fallback
    if (pg) pg.classList.add('active');
    const pages = ['home', 'stats', 'ach'];
    document.querySelectorAll('.bnav button').forEach((b, i) => {
        if (i === 1) return;
        b.classList.toggle('active', pages[i > 1 ? i - 1 : 0] === p);
    });
    if (p === 'home') { delete document.body.dataset.game; updHome(); checkDailyStreak(); }
    if (p === 'stats') renderStats();
    if (p === 'ach') renderAch();
    window.scrollTo(0, 0);
}

function checkDailyStreak() {
  const today = new Date().toDateString();
  const last = D.lastPlay;
  if (last !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (last === yesterday.toDateString()) D.streak++;
    else D.streak = 1;
    D.lastPlay = today;
    saveD(); checkAch();
  }
}
/* ============ TOAST ============ */
let tTO = null;
function toast(m, t = 'ok') {
    const e = document.getElementById('tst');
    if (!e) return;   // ✅ nunca lança erro
    e.className = 'toast ' + t;
    e.innerHTML = m;
    e.classList.add('show');
    clearTimeout(tTO);
    tTO = setTimeout(() => e.classList.remove('show'), 2500);
}

/* ============ TEMA ============ */
function applyTh(t) {
  document.documentElement.setAttribute('data-theme', t);
  D.th = t; saveD();
  const ic = document.getElementById('themeIcon');
  if (ic) ic.className = t === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
}
function toggleTheme() {
  applyTh(D.th === 'dark' ? 'light' : 'dark');
  if (document.getElementById('p-stats').classList.contains('active')) renderStats();
}
/* ============ UTIL ============ */
function shuf(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function rShp(f) {
  const m = {
    circle: '<svg width="40" height="40"><circle cx="20" cy="20" r="16" fill="' + f.c + '"/></svg>',
    square: '<svg width="40" height="40"><rect x="4" y="4" width="32" height="32" fill="' + f.c + '"/></svg>',
    triangle: '<svg width="40" height="40"><polygon points="20,4 36,36 4,36" fill="' + f.c + '"/></svg>',
    diamond: '<svg width="40" height="40"><polygon points="20,2 38,20 20,38 2,20" fill="' + f.c + '"/></svg>',
    star: '<svg width="40" height="40"><polygon points="20,2 25,15 38,15 27,23 31,37 20,28 9,37 13,23 2,15 15,15" fill="' + f.c + '"/></svg>',
    cross: '<svg width="40" height="40"><path d="M15,4 h10 v11 h11 v10 h-11 v11 h-10 v-11 h-11 v-10 h11 z" fill="' + f.c + '"/></svg>'
  };
  return m[f.s] || '';
}
function rShpSmall(f) {
  const m = {
    circle: '<svg width="28" height="28"><circle cx="14" cy="14" r="11" fill="' + f.c + '"/></svg>',
    square: '<svg width="28" height="28"><rect x="3" y="3" width="22" height="22" fill="' + f.c + '"/></svg>',
    triangle: '<svg width="28" height="28"><polygon points="14,3 25,25 3,25" fill="' + f.c + '"/></svg>',
    diamond: '<svg width="28" height="28"><polygon points="14,1 27,14 14,27 1,14" fill="' + f.c + '"/></svg>',
    star: '<svg width="28" height="28"><polygon points="14,1 17,10 27,10 19,16 22,26 14,20 6,26 9,16 1,10 11,10" fill="' + f.c + '"/></svg>',
    cross: '<svg width="28" height="28"><path d="M10,3 h8 v7 h7 v8 h-7 v7 h-8 v-7 h-7 v-8 h7 z" fill="' + f.c + '"/></svg>'
  };
  return m[f.s] || '';
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
/* ============ HOME ============ */
function updHome() {
  document.getElementById('hScore').textContent = D.ts;
  document.getElementById('hGames').textContent = D.tg;
  document.getElementById('hAch').textContent = D.a.length;
  document.getElementById('streakCount').textContent = D.streak || 0;
  const badge = document.getElementById('streakBadge');
  if (D.streak >= 7) badge.style.background = 'linear-gradient(135deg, rgba(245,158,11,.35), rgba(239,68,68,.35))';
  const hour = new Date().getHours();
  let userName = ''; try { userName = localStorage.getItem('userName') || ''; } catch (e) { }
  let greeting = 'Olá';
  if (hour < 12) greeting = 'Bom dia';
  else if (hour < 19) greeting = 'Boa tarde';
  else greeting = 'Boa noite';
  document.getElementById('heroGreeting').textContent = greeting + (userName ? ', ' + userName : '') + '! Vamos Treinar a Mente! 👋';
}
function renderGL() {
  document.getElementById('gList').innerHTML = GAMES.map(g => {
    const cls = g.id === 'psy' ? 'game-card game-card-featured' : 'game-card';
    return '<div class="' + cls + '" style="--card-color:' + g.c + '" onclick="startG(\'' + g.id + '\')">' +
      '<div class="game-card-top"><div class="game-icon-wrap">' + g.i + '</div><div class="game-name">' + g.n + '</div></div>' +
      '<div class="game-card-bottom"><span class="game-tag"><i class="bi bi-clock-fill"></i> ' + (g.id === 'psy' ? '10 min' : g.t + 's') + '</span>' +
      '<div class="game-play-btn"><i class="bi bi-play-fill"></i></div></div></div>';
  }).join('');
}
/* ============ DIFICULDADE ============ */
function setDiff(n, el) {
  S.diff = n;
  document.querySelectorAll('#p-home .diff-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function setSimDiff(n, el) {
  S.simDiff = n;
  document.querySelectorAll('.modal-diff-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
/* ============ MODAL ============ */
function openSimModal() {
    renderModalStats();
    // Atualizar descrição e lista de jogos dinamicamente
    const desc = document.querySelector('#simModal .modal-desc');
    if (desc) desc.innerHTML = `${SIM_GAMES.length} jogos • ${SIM_GAMES.length * S.totalQ} perguntas • ~10 minutos<br>Faz num local tranquilo, sem pausas`;
    const strip = document.querySelector('#simModal .modal-games-strip');
    if (strip) strip.innerHTML = SIM_GAMES.map(g => `<div class="modal-game-chip" title="${g.n}">${g.i}</div>`).join('');
    document.getElementById('simModal').classList.add('show');
}

function closeSimModal() { document.getElementById('simModal').classList.remove('show'); }
document.addEventListener('click', function (e) { if (e.target.id === 'simModal') closeSimModal(); });
function renderModalStats() {
  const statsDiv = document.getElementById('modalStats');
  if (D.simHistory.length === 0) { statsDiv.style.display = 'none'; return; }
  statsDiv.style.display = 'grid';
  document.getElementById('mStatCount').textContent = D.sm;
  document.getElementById('mStatBest').textContent = Math.max.apply(null, D.simHistory.map(s => s.score));
  document.getElementById('mStatAvg').textContent = Math.round(D.simHistory.reduce((a, s) => a + s.score, 0) / D.simHistory.length);
}
function confirmSim() {
  closeSimModal();
  S.diff = S.simDiff;
  startSim();
}
/* ============ INICIAR JOGO ============ */
function startG(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  S.game = id; S.q = 0; S.score = 0; S.correct = 0; S.time = g.t;
  S.start = Date.now(); S.sel = null; S.ans = null; S.sim = false;
  S.simI = SIM_GAMES.length;  // ✅ BUG FIX: resetar contador de simulação
  S.ended = false; // ✅ marca como não terminado
  S.rotDeck = null; S.rotDeckKey = null;  // ✅ BUG FIX: resetar baralho 2D
  S.telDeck = null; S.telDeckKey = null;   // ✅ BUG FIX: resetar baralho 3D
  document.body.dataset.game = id;
  document.getElementById('gTitle').textContent = g.n;
  document.getElementById('gSub').textContent = ['', 'Fácil', 'Médio', 'Difícil'][S.diff];
  document.getElementById('qT').textContent = S.totalQ;
  document.getElementById('gScore').textContent = '0';
  document.getElementById('qP').style.width = '0%';
  const noButtons = ['rea', 'mem', 'psy'];
  document.getElementById('gActs').style.display = noButtons.includes(id) ? 'none' : 'flex';
  go('game');
  if (id === 'psy') {
    document.getElementById('gTimer').textContent = '—';
    document.getElementById('gTimer').classList.remove('warn');
    gPsy(document.getElementById('gArea'));
    return;
  }
  startTm();
  nextQ();
}

function startTm() {
    clearInterval(S.timer);
    S.timer = null;
    // ✅ BUG FIX: se já não há tempo, termina imediatamente
    if (S.time <= 0) { endG(); return; }
    updTm();
    S.timer = setInterval(() => {
        S.time--;
        updTm();
        if (S.time <= 0) {
            clearInterval(S.timer);
            S.timer = null;
            endG();   // ✅ garante que o jogo finaliza ao acabar o tempo
        }
    }, 1000);
}

function updTm() {
  const e = document.getElementById('gTimer');
  if (!e) return;
  e.textContent = S.time;
  e.classList.toggle('warn', S.time <= 10);
}
/* ============ PRÓXIMA PERGUNTA ============ */
function nextQ() {
  if (S.ended) return;  // ✅ BUG FIX: se o jogo já terminou, não continua
  if (S.q >= S.totalQ || S.time <= 0) { endG(); return; }
  S.q++; S.sel = null; S.ans = null;
  const qn = document.getElementById('qN');
  const qp = document.getElementById('qP');
  if (qn) qn.textContent = S.q;
  if (qp) qp.style.width = ((S.q - 1) / S.totalQ * 100) + '%';
  const a = document.getElementById('gArea');
  a.classList.remove('fade-in'); void a.offsetWidth; a.classList.add('fade-in');
  const generators = {
      fig: gFig, num: gNum, mem: gMem, rea: gRea,
      mat: gMat, log: gLog, ana: gAna, rot: gRot, dom: gDom,
      tel: gTel
  };

  if (generators[S.game]) generators[S.game](a);
}
/* ============ GERADORES ============ */
function gFig(a) {
  const sh = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross'];
  const co = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const len = 3 + S.diff;
  const pt = Math.floor(Math.random() * 3);
  const ss = Math.floor(Math.random() * sh.length);
  const sc = Math.floor(Math.random() * co.length);
  const step1 = 1 + Math.floor(Math.random() * 2);
  const step2 = 1 + Math.floor(Math.random() * 2);
  const seq = [];
  for (let i = 0; i < len; i++) {
    let s, c;
    if (pt === 0) { s = sh[(ss + i * step1) % sh.length]; c = co[sc]; }
    else if (pt === 1) { s = sh[ss]; c = co[(sc + i * step2) % co.length]; }
    else { s = sh[(ss + i) % sh.length]; c = co[(sc + i) % co.length]; }
    seq.push({ s, c });
  }
  const ans = seq[seq.length - 1];
  const opts = [ans];
  let safe = 0;
  while (opts.length < 4 && safe < 30) {
    safe++;
    const s = sh[Math.floor(Math.random() * sh.length)];
    const c = co[Math.floor(Math.random() * co.length)];
    if (!opts.find(o => o.s === s && o.c === c)) opts.push({ s, c });
  }
  shuf(opts);
  S.ans = opts.indexOf(ans);
  a.innerHTML = '<div class="text-center mb-3"><small class="text-muted">Qual é a próxima figura?</small></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2 mb-3">' +
    seq.slice(0, -1).map(f => '<div class="fbox">' + rShp(f) + '</div>').join('') +
    '<div class="fbox" style="border-style:dashed;color:var(--text-muted);font-size:1.5rem">?</div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((f, i) => '<div class="fbox ans" onclick="pickOpt(this,' + i + ')">' + rShp(f) + '</div>').join('') + '</div>';
}
function gNum(a) {
  const d = S.diff;
  const types = ['add', 'mult', 'square', 'fib', 'alt'];
  const t = types[Math.floor(Math.random() * Math.min(2 + d, types.length))];
  const seq = [];
  const st = Math.floor(Math.random() * 10) + 1;
  if (t === 'add') { const s = Math.floor(Math.random() * 5) + 1 + d; for (let i = 0; i < 5; i++) seq.push(st + i * s); }
  else if (t === 'mult') { const m = Math.floor(Math.random() * 3) + 2; let v = st; for (let i = 0; i < 5; i++) { seq.push(v); v *= m; } }
  else if (t === 'square') { for (let i = 0; i < 5; i++) seq.push((st + i) * (st + i)); }
  else if (t === 'fib') { seq.push(1, 1); for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); }
  else { const x = Math.floor(Math.random() * 5) + 1, y = Math.floor(Math.random() * 3) + 1; for (let i = 0; i < 5; i++) seq.push(st + (i % 2 === 0 ? x * i : y * i)); }
  const ans = seq[seq.length - 1];
  const opts = [ans];
  let safe = 0;
  while (opts.length < 4 && safe < 30) {
    safe++;
    const off = (Math.floor(Math.random() * 10) - 5) || 1;
    const v = ans + off * d;
    if (!opts.includes(v) && v >= 0) opts.push(v);
  }
  shuf(opts);
  S.ans = opts.indexOf(ans);
  a.innerHTML = '<div class="text-center mb-3"><small class="text-muted">Qual é o próximo número?</small></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2 mb-3">' +
    seq.slice(0, -1).map(n => '<div class="fbox" style="font-size:1.3rem;font-weight:700">' + n + '</div>').join('') +
    '<div class="fbox" style="border-style:dashed;font-size:1.3rem;color:var(--text-muted)">?</div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((n, i) => '<div class="fbox ans" style="font-size:1.3rem;font-weight:700" onclick="pickOpt(this,' + i + ')">' + n + '</div>').join('') + '</div>';
}

function gMem(a) {
  const d = S.diff;
  const cols = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  const len = 3 + d;
  const seq = [];
  const isSim = a.id === 'simGArea';

  const miId = isSim ? 'simMI' : 'mI';    // legenda
  const mdId = isSim ? 'simMD' : 'mD';    // zona de exibição
  const mInId = isSim ? 'simMIn' : 'mIn';   // área de reprodução
  const mSId = isSim ? 'simMS' : 'mS';    // seleção do utilizador

  for (let i = 0; i < len; i++) seq.push(Math.floor(Math.random() * cols.length));

  clearMemTimeouts();

  a.innerHTML = `<div class="text-center mb-3"><small class="text-muted" id="${miId}">Memoriza a sequência...</small></div>
    <div id="${mdId}" class="d-flex justify-content-center flex-wrap gap-2 mb-3" style="min-height:70px"></div>
    <div id="${mInId}" style="display:none">
      <div class="text-center mb-2"><small class="text-muted">Reproduz na ordem</small></div>
      <div class="d-flex justify-content-center flex-wrap gap-2 mb-3">
        ${cols.map((c, i) => `<div class="ccell" style="background:${c}" onclick="pickMem(${i})"></div>`).join('')}
      </div>
      <div class="d-flex justify-content-center flex-wrap gap-2" id="${mSId}" style="min-height:50px"></div>
    </div>`;

  // Exibir sequência célula a célula
  seq.forEach((c, i) => {
    const t = setTimeout(() => {
      // ✅ BUG 2 FIX: não executar se a área já foi substituída
      const el = document.getElementById(mdId);
      if (!el || S.game !== 'mem') return;
      const cell = document.createElement('div');
      cell.className = 'ccell';
      cell.style.background = cols[c];
      el.appendChild(cell);
    }, i * 600);
    S.memTimeouts.push(t);
  });

  // Revelar área de reprodução
  const reveal = setTimeout(() => {
    if (S.game !== 'mem') return;
    const dispEl = document.getElementById(mdId);
    const inEl = document.getElementById(mInId);
    const lblEl = document.getElementById(miId);
    // ✅ BUG 1+2 FIX: validar existência antes de usar
    if (!dispEl || !inEl || !lblEl) return;
    dispEl.innerHTML = '';
    inEl.style.display = 'block';
    lblEl.textContent = 'Agora reproduz!';
    S.memPhase = 'input';
  }, seq.length * 600 + 800);
  S.memTimeouts.push(reveal);

  S.memSeq = seq; S.memCols = cols; S.memUser = [];
  S.memDone = false;
  S.memPhase = 'show';
}

// ✅ Função auxiliar — limpa todos os timeouts do jogo de memória
function clearMemTimeouts() {
  if (S.memTimeouts) S.memTimeouts.forEach(t => clearTimeout(t));
  S.memTimeouts = [];
}

function pickMem(i) {
  if (S.memDone || S.memPhase !== 'input' || S.time <= 0) return;

  S.memUser.push(i);
  const selId = S.sim ? 'simMS' : 'mS';
  const sel = document.getElementById(selId);
  if (!sel) return;

  const c = document.createElement('div');
  c.className = 'ccell';
  c.style.background = S.memCols[i];
  c.style.width = '40px';
  c.style.height = '40px';
  sel.appendChild(c);

  if (S.memUser.length === S.memSeq.length) {
    S.memDone = true; // ✅ BUG 3 FIX: impede cliques duplicados na janela de 400ms
    let ok = true;
    for (let j = 0; j < S.memSeq.length; j++) {
      if (S.memUser[j] !== S.memSeq[j]) { ok = false; break; }
    }
    S.sel = 0;
    S.ans = ok ? 0 : 1;
    const t = setTimeout(() => {
      if (S.sim) submitSimAns();
      else submitAns();
    }, 400);
    S.memTimeouts.push(t);
  }
}

function gRea(a) {
  const isSim = a.id === 'simGArea';
  const rzId = isSim ? 'simRZ' : 'rz';
  const rRId = isSim ? 'simRR' : 'rR';
  clearTimeout(S.reactTO);
  a.innerHTML = '<div class="text-center mb-2"><small class="text-muted">Clica quando ficar VERDE!</small></div>' +
    '<div class="rzone" id="' + rzId + '" style="background:var(--danger)" onclick="clickReaSim(event)">Espera...</div>' +
    '<div class="text-center mt-2" id="' + rRId + '"></div>';
  S.reactReady = false; S.reactDone = false; S.reactionTime = null;
  const delay = 1500 + Math.random() * 2500;
  S.reactTO = setTimeout(() => {
    if (S.game !== 'rea') return;
    const z = document.getElementById(rzId);
    if (!z) return;
    z.style.background = 'var(--success)';
    z.textContent = 'AGORA!';
    S.reactStart = Date.now();
    S.reactReady = true;
  }, delay);
}
function clickReaSim(e) {
  const z = e.currentTarget || e.target;
  if (!z || S.reactDone) return;

  if (!S.reactReady) {
    z.style.background = 'var(--warning)';
    z.textContent = 'Cedo demais!';
    S.score = Math.max(0, S.score - 5);
    const gs = S.sim ? document.getElementById('simGScore') : document.getElementById('gScore');
    if (gs) gs.textContent = S.score;
    S.reactDone = true;
    S.sel = 0; S.ans = 1;
    setTimeout(() => { 
        if (S.sim) {
          const gs = document.getElementById('simGScore');
          if (gs) gs.textContent = S.score;
        } else {
          const gs = document.getElementById('gScore');
          if (gs) gs.textContent = S.score;
        }
      }, 800);
    return;
  }

  const t = Date.now() - S.reactStart;
  S.reactDone = true;
  S.reactionTime = t;
  z.textContent = t + 'ms';
  const r = document.getElementById(z.id.replace('RZ', 'RR'));
  if (r) r.textContent = 'Tempo: ' + t + 'ms';
  S.sel = 0; S.ans = 0;
  setTimeout(() => { if (S.sim) submitSimAns(); else submitAns(); }, 900);
}

function gMat(a) {
  const d = S.diff;
  let x, y, op, ans;
  if (d === 1) {
    x = Math.floor(Math.random() * 20) + 1; y = Math.floor(Math.random() * 20) + 1;
    op = Math.random() < .5 ? '+' : '-';
    ans = op === '+' ? x + y : x - y;
  } else if (d === 2) {
    op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
    if (op === '×') { x = Math.floor(Math.random() * 12) + 2; y = Math.floor(Math.random() * 12) + 2; ans = x * y; }
    else { x = Math.floor(Math.random() * 50) + 10; y = Math.floor(Math.random() * 30) + 5; ans = op === '+' ? x + y : x - y; }
  } else {
    const t = Math.floor(Math.random() * 3);
    if (t === 0) { x = Math.floor(Math.random() * 100) + 20; y = Math.floor(Math.random() * 100) + 20; op = Math.random() < .5 ? '+' : '-'; ans = op === '+' ? x + y : x - y; }
    else if (t === 1) { x = Math.floor(Math.random() * 15) + 2; y = Math.floor(Math.random() * 15) + 2; op = '×'; ans = x * y; }
    else { y = Math.floor(Math.random() * 10) + 2; ans = Math.floor(Math.random() * 12) + 2; x = y * ans; op = '÷'; }
  }
  const distractors = new Set();
  let tries = 0;
  while (distractors.size < 3 && tries < 50) {
    tries++;
    const range = Math.ceil(Math.max(1, Math.abs(ans)) * 0.3) + d * 3;
    const offset = (Math.random() < .5 ? 1 : -1) * (Math.floor(Math.random() * range) + 1);
    const v = ans + offset;
    if (v !== ans && v >= 0 && !distractors.has(v)) distractors.add(v);
  }
  let fb = 1;
  while (distractors.size < 3) {
    const v = ans + fb * (d + 1);
    if (v !== ans && v >= 0 && !distractors.has(v)) distractors.add(v);
    fb = fb > 0 ? -fb : -fb + 1;
  }
  const opts = [ans, ...distractors];
  shuf(opts);
  S.ans = opts.indexOf(ans);
  a.innerHTML = '<div class="text-center mb-3"><small class="text-muted">Resolve a operação</small>' +
    '<div style="font-size:2.5rem;font-weight:700;margin-top:.5rem">' + x + ' ' + op + ' ' + y + ' = ?</div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((n, i) => '<div class="fbox ans" style="font-size:1.5rem;font-weight:700;min-width:80px" onclick="pickOpt(this,' + i + ')">' + n + '</div>').join('') + '</div>';
}
function gLog(a) {
  const sh = ['●', '■', '▲', '◆', '★'];
  const co = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const m = { '●': 'circle', '■': 'square', '▲': 'triangle', '◆': 'diamond', '★': 'star' };
  const r = Math.floor(Math.random() * 3);
  const mat = [];
  if (r === 0) { for (let i = 0; i < 3; i++) { const row = []; const s = sh[i % sh.length]; for (let j = 0; j < 3; j++) row.push({ s, c: co[(i + j) % co.length] }); mat.push(row); } }
  else if (r === 1) { for (let i = 0; i < 3; i++) { const row = []; const c = co[i % co.length]; for (let j = 0; j < 3; j++) row.push({ s: sh[(i + j) % sh.length], c }); mat.push(row); } }
  else { for (let i = 0; i < 3; i++) { const row = []; for (let j = 0; j < 3; j++) row.push({ s: sh[(i + j) % sh.length], c: co[(i * 2 + j) % co.length] }); mat.push(row); } }
  const ans = mat[2][2];
  const opts = [ans];
  let safe = 0;
  while (opts.length < 4 && safe < 30) {
    safe++;
    const s = sh[Math.floor(Math.random() * sh.length)];
    const c = co[Math.floor(Math.random() * co.length)];
    if (!opts.find(o => o.s === s && o.c === c)) opts.push({ s, c });
  }
  shuf(opts);
  S.ans = opts.indexOf(ans);
  const rc = f => rShpSmall({ s: m[f.s], c: f.c });
  const rcBig = f => rShp({ s: m[f.s], c: f.c });
  a.innerHTML = '<div class="text-center mb-2"><small class="text-muted">Completa a matriz 3×3</small></div>' +
    '<div class="d-flex justify-content-center mb-2"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem">' +
    mat.flat().slice(0, 8).map(f => '<div class="lbox">' + rc(f) + '</div>').join('') +
    '<div class="lbox" style="border-style:dashed;color:var(--text-muted);font-size:1.2rem">?</div></div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((f, i) => '<div class="lbox ans" onclick="pickOpt(this,' + i + ')">' + rcBig(f) + '</div>').join('') + '</div>';
}
/* ============ ANALOGIAS VERBAIS ============ */
function gAna(a) {
  const analogias = [
    { a: 'PÃO', b: 'TRIGO', c: 'VINHO', d: 'UVA', opts: ['UVA', 'CEVADA', 'MOSTO', 'VIDEIRA'] },
    { a: 'ÁRVORE', b: 'FLORESTA', c: 'PEIXE', d: 'CARDUME', opts: ['CARDUME', 'RIO', 'MAR', 'REDE'] },
    { a: 'PÁGINA', b: 'LIVRO', c: 'TECLA', d: 'PIANO', opts: ['PIANO', 'MÚSICA', 'SOM', 'DEDOS'] },
    { a: 'GOTA', b: 'OCEANO', c: 'ESTRELA', d: 'GALÁXIA', opts: ['GALÁXIA', 'CÉU', 'NOITE', 'LUAR'] },
    { a: 'MÉDICO', b: 'HOSPITAL', c: 'PROFESSOR', d: 'ESCOLA', opts: ['ESCOLA', 'ALUNO', 'AULA', 'ENSINO'] },
    { a: 'JUÍZ', b: 'TRIBUNAL', c: 'PADRE', d: 'IGREJA', opts: ['IGREJA', 'ALTAR', 'FÉ', 'MISSA'] },
    { a: 'COZINHEIRO', b: 'COZINHA', c: 'PILOTO', d: 'COCKPIT', opts: ['COCKPIT', 'AVIÃO', 'AEROPORTO', 'CÉU'] },
    { a: 'ATOR', b: 'TEATRO', c: 'BANCÁRIO', d: 'BANCO', opts: ['BANCO', 'DINHEIRO', 'COFRE', 'CLIENTE'] },
    { a: 'CÃO', b: 'LADRAR', c: 'GATO', d: 'MIAR', opts: ['MIAR', 'RONRONAR', 'FELINO', 'PELO'] },
    { a: 'LEÃO', b: 'RUGIR', c: 'LOBO', d: 'UIVAR', opts: ['UIVAR', 'ALCATEIA', 'NOITE', 'LUA'] },
    { a: 'CAVALO', b: 'RELINCHAR', c: 'BURRO', d: 'ZURRAR', opts: ['ZURRAR', 'ORELHAS', 'CARGA', 'TEIMOSO'] },
    { a: 'PÁSSARO', b: 'VOAR', c: 'PEIXE', d: 'NADAR', opts: ['NADAR', 'BARBATANA', 'RIO', 'ESCAMAS'] },
    { a: 'FORMIGA', b: 'TRABALHADORA', c: 'CIGARRA', d: 'PREGUIÇOSA', opts: ['PREGUIÇOSA', 'CANTAR', 'VERÃO', 'MÚSICA'] },
    { a: 'PORTUGAL', b: 'LISBOA', c: 'FRANÇA', d: 'PARIS', opts: ['PARIS', 'LYON', 'MARSALHA', 'NICE'] },
    { a: 'ESPANHA', b: 'MADRID', c: 'ITÁLIA', d: 'ROMA', opts: ['ROMA', 'MILÃO', 'NÁPOLES', 'VENEZA'] },
    { a: 'ALEMANHA', b: 'BERLIM', c: 'JAPÃO', d: 'TÓQUIO', opts: ['TÓQUIO', 'OSAKA', 'QUIOTO', 'HIROSHIMA'] },
    { a: 'BRASIL', b: 'BRASÍLIA', c: 'EUA', d: 'WASHINGTON', opts: ['WASHINGTON', 'NOVA IORQUE', 'CALIFÓRNIA', 'MIAMI'] },
    { a: 'CANETA', b: 'ESCREVER', c: 'TESOURA', d: 'CORTAR', opts: ['CORTAR', 'PAPEL', 'LÂMINA', 'AFIADA'] },
    { a: 'MARTELO', b: 'PREGAR', c: 'CHAVE', d: 'APERTAR', opts: ['APERTAR', 'PARAFUSO', 'PORCA', 'FERRAMENTA'] },
    { a: 'PINCEL', b: 'PINTAR', c: 'BISTURI', d: 'CIRURGIAR', opts: ['CIRURGIAR', 'HOSPITAL', 'DOENTE', 'OPERAR'] },
    { a: 'BARCO', b: 'NAVEGAR', c: 'BICICLETA', d: 'PEDALAR', opts: ['PEDALAR', 'RODA', 'ESTRADA', 'VELOCIDADE'] },
    { a: 'VERÃO', b: 'QUENTE', c: 'INVERNO', d: 'FRIO', opts: ['FRIO', 'GELO', 'NEVE', 'CHUVA'] },
    { a: 'PRIMAVERA', b: 'FLORES', c: 'OUTONO', d: 'FOLHAS', opts: ['FOLHAS', 'VENTO', 'CHUVA', 'FRIO'] },
    { a: 'DIA', b: 'SOL', c: 'NOITE', d: 'LUA', opts: ['LUA', 'ESTRELAS', 'ESCURIDÃO', 'SONO'] },
    { a: 'MANHÃ', b: 'PEQUENO-ALMOÇO', c: 'NOITE', d: 'JANTAR', opts: ['JANTAR', 'CEIA', 'SOPA', 'DEITAR'] },
    { a: 'MADEIRA', b: 'MÓVEL', c: 'TECIDO', d: 'ROUPA', opts: ['ROUPA', 'ALGODÃO', 'LINHO', 'VESTIR'] },
    { a: 'LEITE', b: 'QUEIJO', c: 'UVA', d: 'VINHO', opts: ['VINHO', 'ADEGA', 'CASTA', 'BARRICA'] },
    { a: 'BARRO', b: 'TIJOLO', c: 'AREIA', d: 'VIDRO', opts: ['VIDRO', 'JANELA', 'SILÍCIO', 'TRANSPARENTE'] },
    { a: 'FERRO', b: 'AÇO', c: 'COBRE', d: 'LATÃO', opts: ['LATÃO', 'ZINCO', 'OURO', 'PRATA'] },
    { a: 'FOGO', b: 'CALOR', c: 'GELO', d: 'FRIO', opts: ['FRIO', 'CONGELAR', 'ÁGUA', 'NEVE'] },
    { a: 'CHUVA', b: 'MOLHADO', c: 'SOL', d: 'SECO', opts: ['SECO', 'ARDENTE', 'CALOR', 'DESERTO'] },
    { a: 'ESTUDO', b: 'CONHECIMENTO', c: 'EXERCÍCIO', d: 'FORÇA', opts: ['FORÇA', 'MÚSCULO', 'SAÚDE', 'GINÁSIO'] },
    { a: 'SEMENTE', b: 'PLANTA', c: 'OVO', d: 'GALO', opts: ['GALO', 'GALINHA', 'PINTAINHO', 'CASCA'] },
    { a: 'ALTO', b: 'BAIXO', c: 'LARGO', d: 'ESTREITO', opts: ['ESTREITO', 'FUNDO', 'CURTO', 'PEQUENO'] },
    { a: 'ENTRAR', b: 'SAIR', c: 'SUBIR', d: 'DESCER', opts: ['DESCER', 'CAIR', 'BAIXAR', 'IR'] },
    { a: 'AMOR', b: 'ÓDIO', c: 'PAZ', d: 'GUERRA', opts: ['GUERRA', 'CONFLITO', 'BATALHA', 'LUTA'] },
    { a: 'VERDADE', b: 'MENTIRA', c: 'JUSTIÇA', d: 'INJUSTIÇA', opts: ['INJUSTIÇA', 'CRIME', 'CULPA', 'PUNIÇÃO'] },
    { a: 'TERMÓMETRO', b: 'TEMPERATURA', c: 'RELÓGIO', d: 'TEMPO', opts: ['TEMPO', 'HORAS', 'MINUTOS', 'PONTEIROS'] },
    { a: 'BALANÇA', b: 'PESO', c: 'RÉGUA', d: 'COMPRIMENTO', opts: ['COMPRIMENTO', 'METRO', 'CENTÍMETRO', 'DISTÂNCIA'] },
    { a: 'BARÓMETRO', b: 'PRESSÃO', c: 'HIGRÓMETRO', d: 'HUMIDADE', opts: ['HUMIDADE', 'CHUVA', 'ORVALHO', 'NEBLINA'] },
    { a: 'ÁGUA', b: 'COPO', c: 'CARTA', d: 'ENVELOPE', opts: ['ENVELOPE', 'CORREIO', 'SELO', 'MORADA'] },
    { a: 'VINHO', b: 'GARRAFA', c: 'SAL', d: 'SALEIRO', opts: ['SALEIRO', 'PIMENTA', 'TEMPERO', 'COZINHA'] }
  ];
  const ana = analogias[Math.floor(Math.random() * analogias.length)];
  const opts = shuf([...ana.opts]);
  S.ans = opts.indexOf(ana.d);
  a.innerHTML = '<div class="text-center mb-3"><small class="text-muted">Completa a analogia</small>' +
    '<div style="font-size:1.3rem;font-weight:700;margin-top:.75rem;line-height:1.7;padding:1rem;background:var(--bg);border-radius:12px;border:1px solid var(--border)">' +
    '<span style="color:var(--primary)">' + ana.a + '</span> está para <span style="color:var(--primary)">' + ana.b + '</span><br>como<br>' +
    '<span style="color:var(--primary)">' + ana.c + '</span> está para <span style="color:var(--danger);font-size:1.5rem">?</span></div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((o, i) => '<div class="fbox ans" style="font-size:.95rem;font-weight:600;min-width:85px;padding:.5rem" onclick="pickOpt(this,' + i + ')">' + o + '</div>').join('') + '</div>';
}


/* ============ ROTAÇÃO 2D (FIGURAS EM GRELHA) ============ */
function gRot(a) {
    if (!a) a = document.getElementById('gArea');
    const d = S.diff;

    const shapes3 = [
        [[0,0],[1,0],[2,0],[2,1]],
        [[0,0],[0,1],[1,0],[2,0]],
        [[0,1],[1,0],[1,1],[2,0]],
        [[0,0],[1,0],[1,1],[2,1]],
        [[0,0],[0,1],[0,2],[1,0]],
        [[0,0],[0,1],[1,1],[2,1]],
        [[0,0],[1,0],[2,0],[2,1],[1,1]],
        [[0,0],[0,1],[1,1],[2,1],[2,0]],
        [[0,1],[0,2],[1,1],[2,0],[2,1]],
        [[0,0],[1,0],[1,1],[1,2],[2,2]],
        [[0,0],[1,0],[2,0],[2,1],[2,2]],
        [[0,0],[0,1],[0,2],[1,0],[2,0]],
        [[0,0],[1,0],[1,1],[2,1]],
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,0],[0,1],[0,2],[1,1]],
    ];
    const shapes4 = [
        [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2]],
        [[0,0],[0,1],[0,2],[1,0],[2,0],[2,1]],
        [[0,1],[0,2],[1,0],[1,1],[2,0],[2,2]],
        [[0,0],[1,0],[2,0],[3,0],[3,1],[2,1]],
        [[0,0],[0,1],[1,1],[2,1],[2,2],[3,2]],
        [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],
        [[0,1],[1,0],[1,1],[1,2],[2,0],[3,0]],
        [[0,0],[0,1],[1,1],[2,1],[3,1],[3,0]],
        [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3]],
        [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2]],
        [[0,0],[0,1],[1,1],[2,1],[2,2],[3,2]],
        [[0,0],[1,0],[2,0],[2,1],[3,1],[3,2]],
    ];

    const gridSize = d >= 3 ? 4 : 3;
    const pool = gridSize === 3 ? shapes3 : shapes4;
    const anglePool = d === 1 ? [90] : d === 2 ? [90, 180] : [90, 180, 270];

    // ✅ BARALHO ANTI-REPETIÇÃO: combina cada figura com cada ângulo, depois baralha tudo
    if (!Array.isArray(S.rotDeck) || S.rotDeck.length === 0 || S.rotDeckKey !== S.game + '-' + S.diff) {
        const deck = [];
        const sIdx = shuf(pool.map((_, i) => i));  // baralha as figuras
        for (const si of sIdx) {
            const aIdx = shuf(anglePool.map((_, i) => i));  // baralha os ângulos para cada figura
            for (const ai of aIdx) {
                deck.push([si, anglePool[ai]]);
            }
        }
        shuf(deck);  // baralha a combinação final
        S.rotDeck = deck;
        S.rotDeckKey = S.game + '-' + S.diff;
    }
    const pick = S.rotDeck.shift();
    const base = pool[pick[0]];
    const angle = pick[1];

    function rotate(cells, ang, n) {
        return cells.map(([r, c]) => {
            if (ang === 90)  return [c, n - 1 - r];
            if (ang === 180) return [n - 1 - r, n - 1 - c];
            if (ang === 270) return [n - 1 - c, r];
        });
    }
    function mirror(cells, n) { return cells.map(([r, c]) => [r, n - 1 - c]); }
    function key(cells) { return cells.map(([r, c]) => r + ',' + c).sort().join('|'); }

    const correct = rotate(base, angle, gridSize);
    const opts = [correct];
    const used = new Set([key(correct)]);

    const distractors = [];
    [90, 180, 270].forEach(ang => { if (ang !== angle) distractors.push(() => rotate(base, ang, gridSize)); });
    const mirrored = mirror(base, gridSize);
    distractors.push(() => mirrored);
    [90, 180, 270].forEach(ang => distractors.push(() => rotate(mirrored, ang, gridSize)));
    shuf(distractors);

    let safe = 0;
    for (const gen of distractors) {
        if (opts.length >= 4 || safe++ > 40) break;
        const cells = gen();
        const k = key(cells);
        if (!used.has(k)) { used.add(k); opts.push(cells); }
    }
    while (opts.length < 4) {
        const rnd = [];
        while (rnd.length < base.length) {
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);
            if (!rnd.some(([rr, cc]) => rr === r && cc === c)) rnd.push([r, c]);
        }
        const k = key(rnd);
        if (!used.has(k)) { used.add(k); opts.push(rnd); }
    }

    shuf(opts);
    S.ans = opts.indexOf(correct);

    function renderShape(cells, n, size, fillColor) {
        const cs = size / n;
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
            svg += `<rect x="${c*cs}" y="${r*cs}" width="${cs}" height="${cs}" fill="var(--bg)" stroke="var(--border)" stroke-width="0.75"/>`;
        for (const [r, c] of cells)
            svg += `<rect x="${c*cs+1.5}" y="${r*cs+1.5}" width="${cs-3}" height="${cs-3}" rx="4" fill="${fillColor}"/>`;
        svg += '</svg>';
        return svg;
    }

    const angleLabel = angle === 90 ? '90° (um quarto de volta)' : angle === 180 ? '180° (meia volta)' : '270° (três quartos de volta)';

    a.innerHTML = `
        <div class="text-center mb-3">
            <small class="text-muted">Qual das figuras corresponde à rotação de <strong style="color:var(--primary)">${angleLabel}</strong>?</small>
        </div>
        <div class="rot-layout">
            <div class="rot-model">
                <div class="rot-model-label">Figura Original</div>
                ${renderShape(base, gridSize, gridSize === 3 ? 120 : 140, 'var(--primary)')}
            </div>
            <div class="rot-opts">
                ${opts.map((cells, i) => `
                    <div class="fbox ans" onclick="pickOpt(this,${i})" style="width:auto;height:auto;padding:.6rem;border-radius:14px">
                        ${renderShape(cells, gridSize, gridSize === 3 ? 84 : 96, '#818cf8')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/* ============ ROTAÇÃO 3D (FRENTE/LATERAL → PLANTA DO TELHADO) ============ */
/* ============ PLANTAS DE TELHADO (FRENTE/LATERAL → PLANTA) ============ */
function gTel(a) {
    if (!a) a = document.getElementById('gArea');
    const d = S.diff;

    // ---- Catálogo de plantas (vista de cima) ----
    const TOPS = {
        ridgeH: { rect: [110, 70], style: 'ridgeH' },
        ridgeV: { rect: [70, 110], style: 'ridgeV' },
        hipH:   { rect: [110, 70], style: 'hipH' },
        hipV:   { rect: [70, 110], style: 'hipV' },
        pyr:    { rect: [90, 90],  style: 'pyr' },
        ridgeH2:{ rect: [90, 60],  style: 'ridgeH' },
        ridgeV2:{ rect: [60, 90],  style: 'ridgeV' },
        ridgeH3:{ rect: [110, 70], style: 'ridgeH3' },
        ridgeV3:{ rect: [70, 110], style: 'ridgeV3' },
        // Planta em L: duas cumeeiras + vale + espigão de junção
        L: { outline: [[20,15],[120,15],[120,55],[110,55],[110,95],[70,95],[70,55],[20,55]],
             lines: [[20,35,90,35],[90,35,90,95],[70,55,90,35],[110,55,90,35]], door: [82,98,95] },
        // Planta em T: cumeeira principal + ala central com dois vales
        T: { outline: [[20,15],[120,15],[120,55],[100,55],[100,95],[60,95],[60,55],[20,55]],
             lines: [[20,35,120,35],[80,35,80,95],[60,55,80,35],[100,55,80,35]], door: [72,88,95] },
        // Quatro águas + ala em L: espigões + vale
        hipL: { outline: [[20,15],[120,15],[120,55],[110,55],[110,95],[70,95],[70,55],[20,55]],
             lines: [[40,35,100,35],[40,35,20,15],[40,35,20,55],[100,35,120,15],[100,35,120,55],
                     [90,35,90,95],[70,55,90,35],[110,55,100,35]], door: [82,98,95] },
    };

    // ---- Modelos: volumes dos alçados (frente c/ sobreposição, lateral adjacente) ----
    const MODELS = [
        { front: [{s:'band', w:110, x:15}],            side: [{s:'gable', w:70}],              top: 'ridgeH' },
        { front: [{s:'gable', w:70, x:35}],            side: [{s:'band', w:110}],              top: 'ridgeV' },
        { front: [{s:'hip', w:110, x:15}],             side: [{s:'gable', w:70}],              top: 'hipH' },
        { front: [{s:'gable', w:70, x:35}],            side: [{s:'hip', w:110}],               top: 'hipV' },
        { front: [{s:'gable', w:90, x:25}],            side: [{s:'gable', w:90}],              top: 'pyr' },
        { front: [{s:'band', w:100, x:20},{s:'gable', w:40, x:70}], side: [{s:'gable', w:40},{s:'band', w:40}], top: 'L' },
        { front: [{s:'band', w:100, x:20},{s:'gable', w:40, x:60}], side: [{s:'gable', w:40},{s:'band', w:40}], top: 'T' },
        { front: [{s:'hip', w:100, x:20},{s:'gable', w:40, x:70}],  side: [{s:'gable', w:40},{s:'band', w:40}], top: 'hipL' },
        { front: [{s:'band', w:90, x:25}],  side: [{s:'gable', w:60}], top: 'ridgeH2' },  // ← NOVO (índice 8)
        { front: [{s:'gable', w:60, x:40}], side: [{s:'band', w:90}],  top: 'ridgeV2' },  // ← NOVO (índice 9)
      ];
      const byDiff = { 1: [0, 1, 8, 9], 2: [0, 1, 2, 3, 5, 8, 9], 3: [2, 3, 5, 6, 7] };
      const poolByDiff = {
          1: ['ridgeH', 'ridgeV', 'pyr', 'ridgeH3', 'ridgeV3', 'ridgeH2', 'ridgeV2'],
          2: ['ridgeH', 'ridgeV', 'hipH', 'hipV', 'pyr', 'L', 'ridgeH2', 'ridgeV2'],
          3: ['ridgeH', 'ridgeV', 'hipH', 'hipV', 'pyr', 'L', 'T', 'hipL', 'ridgeH3'],
      };

    // ---- Alçado composto por volumes ----
    function elevSVG(vols) {
        const wh = 40, r = 22, yW = 55, yR = yW - r;
        // Layout automático (volumes adjacentes) quando não há x definido
        if (vols.some(v => v.x === undefined)) {
            const tot = vols.reduce((s2, v) => s2 + v.w, 0);
            let x = (140 - tot) / 2;
            vols.forEach(v => { v = Object.assign(v, { x: x }); x += v.w; });
        }
        let s = `<svg width="120" height="95" viewBox="0 0 140 110">`;
        vols.forEach(v => {
            const ox = v.x, w = v.w;
            s += `<rect x="${ox}" y="${yW}" width="${w}" height="${wh}" fill="var(--bg-card)" stroke="var(--text)" stroke-width="2"/>`;
            if (v.s === 'gable') s += `<polygon points="${ox-3},${yW} ${ox+w/2},${yR} ${ox+w+3},${yW}" fill="#f87171" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"/>`;
            else if (v.s === 'band') s += `<polygon points="${ox-3},${yW} ${ox-3},${yR} ${ox+w+3},${yR} ${ox+w+3},${yW}" fill="#f87171" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"/>`;
            else s += `<polygon points="${ox-3},${yW} ${ox+w*0.28},${yR} ${ox+w*0.72},${yR} ${ox+w+3},${yW}" fill="#f87171" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"/>`;
        });
        const v0 = vols[0], vl = vols[vols.length - 1];
        if (v0.w >= 90) s += `<rect x="${v0.x+8}" y="63" width="14" height="12" rx="2" fill="#38bdf8" opacity=".85"/><rect x="${v0.x+v0.w-22}" y="63" width="14" height="12" rx="2" fill="#38bdf8" opacity=".85"/>`;
        s += `<rect x="${vl.x+vl.w/2-8}" y="69" width="16" height="26" rx="2" fill="#8b5cf6" opacity=".85"/>`;
        s += `<line x1="6" y1="95" x2="134" y2="95" stroke="var(--text)" stroke-width="2"/></svg>`;
        return s;
    }

    // ---- Linhas internas das plantas retangulares ----
    function topInner(st, ox, oy, tw, dp) {
        const cx = ox + tw / 2, cy = oy + dp / 2;
        const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>`;
        if (st === 'ridgeH') return L(ox, cy, ox + tw, cy);
        if (st === 'ridgeV') return L(cx, oy, cx, oy + dp);
        if (st === 'ridgeH3') return L(ox, oy + dp / 3, ox + tw, oy + dp / 3);
        if (st === 'ridgeV3') return L(ox + tw / 3, oy, ox + tw / 3, oy + dp);
        if (st === 'hipH') {
            const ins = Math.min(dp / 2, tw / 2 - 4), x1 = ox + ins, x2 = ox + tw - ins;
            return L(x1, cy, x2, cy) + L(x1, cy, ox, oy) + L(x1, cy, ox, oy + dp) + L(x2, cy, ox + tw, oy) + L(x2, cy, ox + tw, oy + dp);
        }
        if (st === 'hipV') {
            const ins = Math.min(tw / 2, dp / 2 - 4), y1 = oy + ins, y2 = oy + dp - ins;
            return L(cx, y1, cx, y2) + L(cx, y1, ox, oy) + L(cx, y1, ox + tw, oy) + L(cx, y2, ox, oy + dp) + L(cx, y2, ox + tw, oy + dp);
        }
        if (st === 'pyr') return L(ox, oy, ox + tw, oy + dp) + L(ox + tw, oy, ox, oy + dp);
        return '';
    }

    // ---- Planta (vista de cima) ----
    function topSVG(key) {
        const t = TOPS[key];
        let s = `<svg width="110" height="88" viewBox="0 0 140 110">`;
        if (t.outline) {
            s += `<polygon points="${t.outline.map(p => p.join(',')).join(' ')}" fill="rgba(248,113,113,.18)" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"/>`;
            t.lines.forEach(l => s += `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>`);
            s += `<line x1="${t.door[0]}" y1="${t.door[2]}" x2="${t.door[1]}" y2="${t.door[2]}" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>`;
        } else {
            const tw = t.rect[0], dp = t.rect[1];
            const ox = (140 - tw) / 2, oy = (110 - dp) / 2;
            s += `<rect x="${ox}" y="${oy}" width="${tw}" height="${dp}" fill="rgba(248,113,113,.18)" stroke="var(--text)" stroke-width="2" rx="2"/>`;
            s += topInner(t.style, ox, oy, tw, dp);
            s += `<line x1="62" y1="${oy+dp}" x2="78" y2="${oy+dp}" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>`;
        }
        s += '</svg>';
        return s;
    }

    // ---- Gerar pergunta (✅ BARALHO ANTI-REPETIÇÃO) ----
    const ids = byDiff[d];
    if (!Array.isArray(S.telDeck) || S.telDeck.length === 0 || S.telDeckKey !== S.game + '-' + S.diff) {
        const deck = [];
        const rounds = Math.ceil((S.totalQ + 2) / ids.length);   // garante ≥ 12 entradas
        for (let r = 0; r < rounds; r++) deck.push(...shuf([...ids]));
        S.telDeck = deck;
        S.telDeckKey = S.game + '-' + S.diff;
    }
    const m = MODELS[S.telDeck.shift()];   // ✅ cada casa só repete depois de todas as outras
    const opts = [m.top, ...shuf(poolByDiff[d].filter(k => k !== m.top)).slice(0, 3)];
    shuf(opts);
    S.ans = opts.indexOf(m.top);

    console.log(`🏠 Rotação 3D - Resposta: ${m.top} → índice ${S.ans}, opções: ${opts.join(', ')}`);

    const lbl = 'font-size:.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem';
    a.innerHTML = `
        <div class="text-center mb-3"><small class="text-muted">Qual é a <strong style="color:var(--primary)">vista de cima</strong> (planta do telhado) correta desta casa?</small></div>
        <div class="d-flex justify-content-center align-items-end gap-3 mb-3 flex-wrap">
            <div class="text-center" style="padding:.75rem;background:var(--bg);border:2px solid var(--border);border-radius:16px">
                <div style="${lbl}">Vista de Frente</div>${elevSVG(m.front.map(v => ({...v})))}
            </div>
            <div class="text-center" style="padding:.75rem;background:var(--bg);border:2px solid var(--border);border-radius:16px">
                <div style="${lbl}">Vista Lateral</div>${elevSVG(m.side.map(v => ({...v})))}
            </div>
        </div>
        <div class="text-center mb-2"><small class="text-muted" style="font-size:.72rem">🟩 entrada = lado da vista de frente · <span style="color:#dc2626;font-weight:700">vermelho</span> = linhas do telhado projetadas</small></div>
        <div class="d-flex justify-content-center flex-wrap gap-3">
            ${opts.map((k, i) => `
                <div class="fbox ans" onclick="pickOpt(this,${i})" style="width:auto;height:auto;padding:.5rem;border-radius:14px">
                    ${topSVG(k)}
                </div>`).join('')}
        </div>`;
}

/* ============ DOMINÓS ============ */
function gDom(a) {
  const pieces = [];
  for (let i = 0; i <= 6; i++) for (let j = i; j <= 6; j++) pieces.push({ top: i, bottom: j });
  const seqLen = 3 + S.diff;
  const sequence = [pieces[Math.floor(Math.random() * pieces.length)]];
  const pattern = Math.floor(Math.random() * 3);
  for (let i = 1; i < seqLen; i++) {
    let next;
    if (pattern === 0) next = { top: (sequence[i - 1].top + 1) % 7, bottom: sequence[i - 1].bottom };
    else if (pattern === 1) next = { top: sequence[i - 1].top, bottom: (sequence[i - 1].bottom + 1) % 7 };
    else next = { top: sequence[i - 1].bottom, bottom: sequence[i - 1].top };
    sequence.push(next);
  }
  const answer = sequence[sequence.length - 1];
  const opts = [answer];
  let safe = 0;
  while (opts.length < 4 && safe < 30) {
    safe++;
    const p = pieces[Math.floor(Math.random() * pieces.length)];
    if (!opts.find(o => o.top === p.top && o.bottom === p.bottom)) opts.push(p);
  }
  shuf(opts);
  S.ans = opts.indexOf(answer);
  function renderPiece(p, size) {
    size = size || 50;
    const dot = '<div style="width:6px;height:6px;background:var(--text);border-radius:50%"></div>';
    const side = n => {
      const positions = {
        0: [], 1: ['center'], 2: ['top-left', 'bottom-right'], 3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
      };
      const styles = {
        'center': 'grid-column:2;grid-row:2', 'top-left': 'grid-column:1;grid-row:1',
        'top-right': 'grid-column:3;grid-row:1', 'middle-left': 'grid-column:1;grid-row:2',
        'middle-right': 'grid-column:3;grid-row:2', 'bottom-left': 'grid-column:1;grid-row:3',
        'bottom-right': 'grid-column:3;grid-row:3'
      };
      return '<div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);place-items:center;padding:2px">' +
        (positions[n] || []).map(ps => '<div style="' + styles[ps] + '">' + dot + '</div>').join('') + '</div>';
    };
    return '<div style="width:' + size + 'px;height:' + (size * 2) + 'px;background:var(--bg-card);border:2px solid var(--border);border-radius:8px;display:flex;flex-direction:column;overflow:hidden">' +
      side(p.top) + '<div style="height:2px;background:var(--border)"></div>' + side(p.bottom) + '</div>';
  }
  a.innerHTML = '<div class="text-center mb-3"><small class="text-muted">Completa a sequência de dominó</small></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2 mb-3" style="align-items:center">' +
    sequence.slice(0, -1).map(p => renderPiece(p, 40)).join('') +
    '<div style="width:40px;height:80px;border:2px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:1.5rem">?</div></div>' +
    '<div class="d-flex justify-content-center flex-wrap gap-2">' +
    opts.map((p, i) => '<div class="fbox ans" onclick="pickOpt(this,' + i + ')" style="padding:0;overflow:hidden">' + renderPiece(p, 35) + '</div>').join('') + '</div>';
}
/* ============ PERFIL PSICOLÓGICO (COM QUESTÕES DE DESPISTE) ============ */
const PSY_PERGUNTAS = [
  {
    q: 'Numa situação de conflito na equipa, tu geralmente:', opts: [
      { t: 'Assumo o controlo e tomo a decisão final', p: 'lider' },
      { t: 'Analiso todos os factos antes de agir', p: 'analit' },
      { t: 'Procuro mediar e encontrar consenso', p: 'social' },
      { t: 'Sugiro uma solução criativa e diferente', p: 'criat' },
      { t: 'Foco-me em executar o que foi decidido', p: 'exec' }]
  },
  {
    q: 'Quando recebes uma tarefa complexa e urgente, a tua primeira reação é:', opts: [
      { t: 'Organizar um plano de ação detalhado', p: 'analit' },
      { t: 'Reunir a equipa e delegar responsabilidades', p: 'lider' },
      { t: 'Procurar uma abordagem inovadora', p: 'criat' },
      { t: 'Começar a trabalhar imediatamente', p: 'exec' },
      { t: 'Considerar o impacto nas pessoas envolvidas', p: 'social' }]
  },
  {
    q: 'O que mais te motiva no trabalho?', opts: [
      { t: 'Liderar projetos e influenciar decisões', p: 'lider' },
      { t: 'Resolver problemas complexos', p: 'analit' },
      { t: 'Ajudar e desenvolver outras pessoas', p: 'social' },
      { t: 'Criar soluções originais', p: 'criat' },
      { t: 'Concluir tarefas com eficiência', p: 'exec' }]
  },
  {
    q: 'Numa reunião de equipa, tu tendes a:', opts: [
      { t: 'Dirigir a discussão e tomar notas', p: 'lider' },
      { t: 'Ouvir atentamente e fazer perguntas críticas', p: 'analit' },
      { t: 'Garantir que todos participam', p: 'social' },
      { t: 'Propor ideias fora da caixa', p: 'criat' },
      { t: 'Focar-me nos prazos e ações concretas', p: 'exec' }]
  },
  {
    q: 'Como lidas com pressão e deadlines apertados?', opts: [
      { t: 'Mantenho a calma e organizo prioridades', p: 'lider' },
      { t: 'Analiso a situação sistematicamente', p: 'analit' },
      { t: 'Procuro apoio na equipa', p: 'social' },
      { t: 'Encontro formas criativas de otimizar', p: 'criat' },
      { t: 'Foco-me em executar sem distrações', p: 'exec' }]
  },
  {
    q: 'Quando enfrentas um problema inesperado, preferes:', opts: [
      { t: 'Tomar decisões rápidas e assertivas', p: 'lider' },
      { t: 'Recolher dados e analisar opções', p: 'analit' },
      { t: 'Consultar colegas e considerar opiniões', p: 'social' },
      { t: 'Experimentar abordagens não convencionais', p: 'criat' },
      { t: 'Aplicar soluções já testadas', p: 'exec' }]
  },
  {
    q: 'O teu estilo de comunicação é mais:', opts: [
      { t: 'Direto e orientado para resultados', p: 'lider' },
      { t: 'Preciso e baseado em factos', p: 'analit' },
      { t: 'Empático e colaborativo', p: 'social' },
      { t: 'Expressivo e inspirador', p: 'criat' },
      { t: 'Prático e objetivo', p: 'exec' }]
  },
  {
    q: 'Num projeto de equipa, o teu papel natural é:', opts: [
      { t: 'Coordenador e tomador de decisões', p: 'lider' },
      { t: 'Especialista técnico e analista', p: 'analit' },
      { t: 'Mediador e suporte da equipa', p: 'social' },
      { t: 'Inovador e gerador de ideias', p: 'criat' },
      { t: 'Executor e garante de qualidade', p: 'exec' }]
  },
  {
    q: 'Como reages a críticas construtivas?', opts: [
      { t: 'Aceito e uso para melhorar a minha liderança', p: 'lider' },
      { t: 'Analiso objetivamente os pontos levantados', p: 'analit' },
      { t: 'Considero o impacto nas relações', p: 'social' },
      { t: 'Vejo como oportunidade de inovar', p: 'criat' },
      { t: 'Foco-me em corrigir erros concretos', p: 'exec' }]
  },
  {
    q: 'O que te define mais profissionalmente?', opts: [
      { t: 'Capacidade de decisão e visão estratégica', p: 'lider' },
      { t: 'Pensamento lógico e analítico', p: 'analit' },
      { t: 'Inteligência emocional e empatia', p: 'social' },
      { t: 'Criatividade e pensamento divergente', p: 'criat' },
      { t: 'Organização e foco em resultados', p: 'exec' }]
  },
  {
    q: 'Numa situação de mudança organizacional, tu:', opts: [
      { t: 'Lideras a transição e comunicas a visão', p: 'lider' },
      { t: 'Avalias riscos e planeias cuidadosamente', p: 'analit' },
      { t: 'Apoias a equipa e geres preocupações', p: 'social' },
      { t: 'Vês oportunidades de inovação', p: 'criat' },
      { t: 'Adaptas processos rapidamente', p: 'exec' }]
  },
  {
    q: 'Como descreverias o teu ambiente de trabalho ideal?', opts: [
      { t: 'Dinâmico, com desafios e autonomia', p: 'lider' },
      { t: 'Estruturado, com dados e análise', p: 'analit' },
      { t: 'Colaborativo, com boa equipa', p: 'social' },
      { t: 'Criativo, com liberdade para inovar', p: 'criat' },
      { t: 'Organizado, com processos claros', p: 'exec' }]
  },
  {
    q: 'Quando tomas uma decisão importante, baseias-te em:', opts: [
      { t: 'Intuição e experiência', p: 'lider' },
      { t: 'Dados e análise racional', p: 'analit' },
      { t: 'Impacto nas pessoas', p: 'social' },
      { t: 'Possibilidades e potencial', p: 'criat' },
      { t: 'Factos e resultados práticos', p: 'exec' }]
  },
  {
    q: 'O teu maior ponto forte é:', opts: [
      { t: 'Liderança e visão', p: 'lider' },
      { t: 'Pensamento crítico', p: 'analit' },
      { t: 'Relacionamentos interpessoais', p: 'social' },
      { t: 'Inovação e originalidade', p: 'criat' },
      { t: 'Eficiência e organização', p: 'exec' }]
  },
  {
    q: 'Numa situação de stress, a tua reação típica é:', opts: [
      { t: 'Assumir o controlo da situação', p: 'lider' },
      { t: 'Analisar calmamente as opções', p: 'analit' },
      { t: 'Procurar apoio e partilhar preocupações', p: 'social' },
      { t: 'Procurar soluções alternativas', p: 'criat' },
      { t: 'Focar-me no essencial e executar', p: 'exec' }]
  }
];
/* NOVO: QUESTÕES DE DESPISTE — DESEJABILIDADE SOCIAL (escala de sinceridade)
   Afirmações que quase ninguém consegue cumprir literalmente.
   Concordar em excesso indica tentativa de dar uma "imagem perfeita" (faking good). */
const PSY_LIE_OPTS = [
  { t: 'Concordo totalmente', lie: 2 },
  { t: 'Concordo', lie: 1 },
  { t: 'Discordo', lie: 0 },
  { t: 'Discordo totalmente', lie: 0 }
];
const PSY_DESPISTE_LIE = [
  { q: 'Nunca digo mentiras, nem mesmo pequenas, para evitar conflitos.' },
  { q: 'Gosto igualmente de todas as pessoas que conheço, sem exceção.' },
  { q: 'Nunca senti inveja ou ciúmes do sucesso de outra pessoa.' },
  { q: 'Reconheço sempre os meus erros imediatamente, sem qualquer resistência.' },
  { q: 'Nunca fico irritado(a), mesmo quando as coisas correm muito mal.' },
  { q: 'Cumpro sempre todas as promessas que faço, sem uma única exceção.' }
];
/* NOVO: QUESTÕES DE DESPISTE — CONSISTÊNCIA (pares invertidos)
   Duas afirmações opostas sobre o mesmo traço. Concordar fortemente com
   as duas ao mesmo tempo revela respostas contraditórias/estratégicas. */
const PSY_CONS_OPTS = [
  { t: 'Discordo totalmente', val: 0 },
  { t: 'Discordo', val: 1 },
  { t: 'Neutro', val: 2 },
  { t: 'Concordo', val: 3 },
  { t: 'Concordo totalmente', val: 4 }
];
const PSY_DESPISTE_CONS = [
  { par: 1, rev: false, q: 'Sinto-me à vontade a conversar com pessoas que acabei de conhecer.' },
  { par: 1, rev: true, q: 'Conversar com desconhecidos deixa-me claramente desconfortável.' },
  { par: 2, rev: false, q: 'Nos trabalhos de grupo, costumo tomar a iniciativa de organizar tudo.' },
  { par: 2, rev: true, q: 'Nos grupos, prefiro que outra pessoa organize e decida por mim.' }
];
/* NOVO: níveis de validade do resultado */
const PSY_VALIDITY = {
  ok: {
    icon: '✅', title: 'Resultado credível', color: 'var(--success)',
    desc: 'As verificações de sinceridade e consistência não detetaram distorções relevantes. O perfil apresentado deve refletir as tuas respostas reais.'
  },
  warn: {
    icon: '⚠️', title: 'Ligeira desejabilidade social', color: 'var(--warning)',
    desc: 'Algumas respostas sugerem tendência para apresentar uma imagem idealizada. O resultado pode estar ligeiramente inflacionado — interpreta com cautela.'
  },
  invalid: {
    icon: '🚨', title: 'Indícios de manipulação', color: 'var(--danger)',
    desc: 'Foram detetadas respostas contraditórias e/ou um padrão elevado de desejabilidade social. Este resultado é pouco fiável e foi excluído do teu histórico de perfil. Recomenda-se refazer o teste com respostas espontâneas e honestas.'
  }
};
const PSY_PROFILES = {
  lider: {
    name: 'Líder Estratégico', emoji: '👑', color: '#ef4444',
    desc: 'Tens uma personalidade assertiva e orientada para resultados. Excelentes capacidades de decisão e visão estratégica. Prosperas em posições de liderança e gestão.',
    strengths: ['Tomada de decisão', 'Visão estratégica', 'Assertividade', 'Gestão de equipas'],
    roles: ['Gestão', 'Coordenação', 'Liderança de projetos', 'Direção']
  },
  analit: {
    name: 'Analítico Racional', emoji: '🔬', color: '#3b82f6',
    desc: 'Tens um pensamento lógico e sistemático. Excelentes capacidades de análise e resolução de problemas complexos. Valorizas precisão e dados.',
    strengths: ['Pensamento crítico', 'Análise de dados', 'Resolução de problemas', 'Planeamento'],
    roles: ['Análise', 'Investigação', 'Planeamento', 'Controlo de qualidade']
  },
  social: {
    name: 'Social Empático', emoji: '🤝', color: '#10b981',
    desc: 'Tens elevada inteligência emocional e empatia. Excelentes capacidades interpessoais e de mediação. Valorizas relações e trabalho em equipa.',
    strengths: ['Empatia', 'Comunicação', 'Mediação', 'Trabalho em equipa'],
    roles: ['Recursos Humanos', 'Atendimento', 'Formação', 'Mediação']
  },
  criat: {
    name: 'Criativo Inovador', emoji: '💡', color: '#f59e0b',
    desc: 'Tens pensamento divergente e originalidade. Excelentes capacidades de inovação e criatividade. Prosperas em ambientes dinâmicos e desafiantes.',
    strengths: ['Criatividade', 'Inovação', 'Pensamento lateral', 'Adaptabilidade'],
    roles: ['Marketing', 'Design', 'Investigação', 'Desenvolvimento']
  },
  exec: {
    name: 'Executor Prático', emoji: '⚙️', color: '#8b5cf6',
    desc: 'Tens foco em resultados e eficiência. Excelentes capacidades de organização e execução. Valorizas processos claros e objetivos concretos.',
    strengths: ['Organização', 'Eficiência', 'Foco em resultados', 'Confiabilidade'],
    roles: ['Operações', 'Logística', 'Administração', 'Produção']
  }
};
function gPsy(a) {
  /* 8 perguntas de perfil + 4 de desejabilidade social + 4 de consistência = 16,
     todas misturadas para que as questões de despiste não sejam identificáveis */
  const profQs = shuf([...PSY_PERGUNTAS]).slice(0, 8).map(q => ({ tipo: 'p', q: q.q, opts: q.opts }));
  const lieQs = shuf([...PSY_DESPISTE_LIE]).slice(0, 4).map(q => ({ tipo: 'lie', q: q.q, opts: PSY_LIE_OPTS }));
  const consQs = PSY_DESPISTE_CONS.map(q => ({ tipo: 'cons', q: q.q, opts: PSY_CONS_OPTS, par: q.par, rev: !!q.rev }));
  S.psyQuestions = shuf([...profQs, ...lieQs, ...consQs]);
  S.psyAnswers = [];
  S.psyCurrentQ = 0;
  const qt = document.getElementById('qT');
  if (qt) qt.textContent = S.psyQuestions.length;
  psyRender(a);
}
function psyRender(a) {
  const gActs = document.getElementById('gActs');
  if (gActs) gActs.style.display = 'none';
  if (S.psyCurrentQ >= S.psyQuestions.length) { psyResult(a); return; }
  const q = S.psyQuestions[S.psyCurrentQ];
  const num = S.psyCurrentQ + 1;
  const total = S.psyQuestions.length;
  const pct = Math.round((num / total) * 100);
  const qp = document.getElementById('qP');
  if (qp) qp.style.width = pct + '%';
  const qn = document.getElementById('qN');
  if (qn) qn.textContent = num;
  a.innerHTML = '<div class="psy-question">' +
    '<div class="psy-progress"><div class="psy-progress-bar" style="width:' + pct + '%"></div></div>' +
    '<div class="psy-q-num">Pergunta ' + num + ' de ' + total + '</div>' +
    '<div class="psy-honesty"><i class="bi bi-shield-check"></i> Teste com verificação de sinceridade e consistência integrada — responde de forma espontânea</div>' +
    '<div class="psy-q-text">' + q.q + '</div>' +
    '<div class="psy-options">' +
    q.opts.map((opt, i) => '<button class="psy-opt" onclick="psyPick(' + i + ')">' +
      '<span class="psy-opt-letter">' + String.fromCharCode(65 + i) + '</span>' +
      '<span class="psy-opt-text">' + opt.t + '</span></button>').join('') +
    '</div></div>';
}
function psyPick(idx) {
  const q = S.psyQuestions[S.psyCurrentQ];
  if (!q) return;
  if (q.tipo === 'p') S.psyAnswers.push({ tipo: 'p', p: q.opts[idx].p });
  else if (q.tipo === 'lie') S.psyAnswers.push({ tipo: 'lie', lie: q.opts[idx].lie });
  else S.psyAnswers.push({ tipo: 'cons', par: q.par, rev: !!q.rev, val: q.opts[idx].val });
  S.psyCurrentQ++;
  const a = document.getElementById('gArea');
  if (a) psyRender(a);
}
/* NOVO: cálculo da validade das respostas */
function psyValidity(answers) {
  let lieScore = 0, lieCount = 0;
  const consByPar = {};
  answers.forEach(r => {
    if (r.tipo === 'lie') { lieScore += r.lie; lieCount++; }
    else if (r.tipo === 'cons') {
      if (!consByPar[r.par]) consByPar[r.par] = {};
      consByPar[r.par][r.rev ? 'neg' : 'pos'] = r.val;
    }
  });
  let contradictions = 0;
  Object.values(consByPar).forEach(pair => {
    if (pair.pos !== undefined && pair.neg !== undefined && pair.pos >= 3 && pair.neg >= 3) contradictions++;
  });
  const lieMax = lieCount * 2;
  let nivel = 'ok';
  if (lieScore >= 5 || contradictions >= 2) nivel = 'invalid';
  else if (lieScore >= 3 || contradictions === 1) nivel = 'warn';
  return { lieScore, lieMax, contradictions, nivel };
}
function psyResult(a) {
  const gActs = document.getElementById('gActs');
  if (gActs) gActs.style.cssText = 'display: none !important;';
  clearInterval(S.timer);
  const elapsed = Math.floor((Date.now() - S.start) / 1000);
  const counts = { lider: 0, analit: 0, social: 0, criat: 0, exec: 0 };
  S.psyAnswers.forEach(r => { if (r.tipo === 'p' && counts[r.p] !== undefined) counts[r.p]++; });
  const maxCount = Math.max.apply(null, Object.values(counts));
  const dominant = Object.keys(counts).find(k => counts[k] === maxCount);
  const profile = PSY_PROFILES[dominant];
  /* NOVO: validar respostas */
  const v = psyValidity(S.psyAnswers);
  const vi = PSY_VALIDITY[v.nivel];
  const sinceridade = v.lieMax > 0 ? Math.round(100 - (v.lieScore / v.lieMax) * 100) : 100;
  S.score = 50; S.correct = 1;
  D.ts += S.score; D.tg++;
  if (!D.gp.includes('psy')) { D.gp.push('psy'); D.ug = D.gp.length; }
  D.h.push({ g: 'psy', s: S.score, c: 1, t: 1, d: S.diff, tm: elapsed, dt: Date.now() });
  if (D.h.length > 100) D.h = D.h.slice(-100);
  D.psyProfiles.push({ profile: dominant, date: Date.now(), validity: v.nivel, lieScore: v.lieScore, counts: counts });
  if (D.psyProfiles.length > 50) D.psyProfiles = D.psyProfiles.slice(-50);
  checkAch(); saveD();
  const gs = document.getElementById('gScore');
  if (gs) gs.textContent = S.score;
  const qp = document.getElementById('qP');
  if (qp) qp.style.width = '100%';
  a.innerHTML = '<div class="psy-result">' +
    '<div class="psy-result-emoji">' + profile.emoji + '</div>' +
    '<div class="psy-result-title">O teu perfil:</div>' +
    '<div class="psy-result-name" style="color:' + profile.color + '">' + profile.name + '</div>' +
    '<div class="psy-result-desc">' + profile.desc + '</div>' +
    /* NOVO: cartão de validade */
    '<div class="psy-validity" style="border-color:' + vi.color + '">' +
    '<div class="psy-validity-icon">' + vi.icon + '</div>' +
    '<div style="flex:1"><div class="psy-validity-title" style="color:' + vi.color + '">' + vi.title + '</div>' +
    '<div class="psy-validity-desc">' + vi.desc + '</div>' +
    '<div class="psy-validity-metrics">' +
    '<span>🕊️ Espontaneidade: ' + sinceridade + '%</span>' +
    '<span>🔁 Contradições: ' + v.contradictions + '/2</span>' +
    '</div></div>' +
    '</div>' +
    '<div class="psy-result-section"><div class="psy-result-section-title">Pontos Fortes</div>' +
    '<div class="psy-result-tags">' + profile.strengths.map(s => '<span class="psy-tag">' + s + '</span>').join('') + '</div></div>' +
    '<div class="psy-result-section"><div class="psy-result-section-title">Funções Ideais</div>' +
    '<div class="psy-result-tags">' + profile.roles.map(r => '<span class="psy-tag">' + r + '</span>').join('') + '</div></div>' +
    '<div class="psy-result-breakdown"><div class="psy-result-section-title">Distribuição de Perfil</div>' +
    Object.entries(counts).map(([key, count]) => {
      const p = PSY_PROFILES[key];
      const profQs = S.psyAnswers.filter(r => r.tipo === 'p').length;
      const pctVal = profQs > 0 ? Math.round((count / profQs) * 100) : 0;
      return '<div class="psy-breakdown-item"><div class="psy-breakdown-label"><span>' + p.emoji + '</span><span>' + p.name + '</span></div>' +
        '<div class="psy-breakdown-bar"><div class="psy-breakdown-fill" style="width:' + pctVal + '%;background:' + p.color + '"></div></div>' +
        '<div class="psy-breakdown-pct">' + pctVal + '%</div></div>';
    }).join('') + '</div></div>';
  if (v.nivel === 'invalid') toast('🚨 Respostas inconsistentes — resultado marcado como não fiável', 'aw');
  else toast('🧠 Perfil identificado: ' + profile.name, 'ok');
}
function pickOpt(el, i) {
  const parent = el.parentElement;
  parent.querySelectorAll('.ans').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  S.sel = i;
}

/* ============ SUBMETER ============ */
function submitAns() {
    if (S.ended) return;  // ✅ BUG FIX: se o jogo já terminou, ignora submissões
    if (S.game !== 'rea' && S.game !== 'mem' && S.sel === null) {
        toast('⚠️ Seleciona uma resposta', 'aw');
        return;
    }
    clearInterval(S.timer);
    clearTimeout(S.reactTO);

    // ✅ 1) Agendar o avanço ANTES de qualquer feedback — não pode ficar preso
    setTimeout(() => {
        if (S.time > 0 && S.q < S.totalQ) { startTm(); nextQ(); }  // ✅ BUG FIX: verificar se há mais perguntas
        else endG();
    }, 900);

    // 2) Pontuação e feedback (executa de forma síncrona, antes do avanço)
    let ok = false;
    if (S.game === 'rea') {
        if (S.reactionTime !== null) {
            const th = [600, 400, 250][S.diff - 1];
            ok = S.reactionTime < th;
            if (ok) { const b = Math.max(5, Math.floor((th - S.reactionTime) / 10)); S.score += b * S.diff; }
        }
    } else {
        ok = (S.sel === S.ans);
        console.log(`📋 Submissão: S.sel=${S.sel}, S.ans=${S.ans}, resultado=${ok}`);
        if (ok) S.score += 10 * S.diff;
    }
    if (ok) {
        S.correct++;
        D.cs++;
        if (D.cs > D.bs) D.bs = D.cs;
        toast('✓ Correto! +' + (10 * S.diff) + ' pts', 'ok');
    } else {
        D.cs = 0;
        toast('✗ Resposta errada', 'aw');
    }
    const gs = document.getElementById('gScore');
    if (gs) gs.textContent = S.score;
}


function skipQ() {
  D.cs = 0;
  clearInterval(S.timer);
  clearTimeout(S.reactTO);
  startTm();
  nextQ();
}

/* ============ FUNÇÕES AUXILIARES ============ */
function setTxt(id, v) {
    const e = document.getElementById(id);
    if (e) e.textContent = v;   // ✅ nunca lança erro
}

/* ============ TERMINAR JOGO ============ */
function endG() {
  clearInterval(S.timer);
  clearTimeout(S.reactTO);
  clearMemTimeouts();
  if (S.ended) return;   // ← NOVO: já terminou → não repete
  S.ended = true;        // ← NOVO: marca como terminado
  const el = Math.floor((Date.now() - S.start) / 1000);
  D.ts += S.score;
  D.tg++;
  if (!D.gp.includes(S.game)) { D.gp.push(S.game); D.ug = D.gp.length; }
  if (S.diff === 3) D.hg++;
  if (S.correct === S.totalQ) D.pg++;
  if (S.game === 'rea' && S.reactionTime && S.reactionTime < D.br) D.br = S.reactionTime;

  if (S.sim) { setTimeout(() => renderSimTransition(), 400); return; };  // ✅ BUG FIX: verificar S.sim em vez de S.simI

  D.h.push({ g: S.game, s: S.score, c: S.correct, t: S.totalQ, d: S.diff, tm: el, dt: Date.now() });
  if (D.h.length > 100) D.h = D.h.slice(-100);
  checkAch();
  saveD();
  const p = S.totalQ > 0 ? S.correct / S.totalQ : 0;
  let em = '🎉', ti = 'Excelente!', su = 'Resultado fantástico';
  if (p < .5) { em = '💪'; ti = 'Continua!'; su = 'A prática leva à perfeição'; }
  else if (p < .8) { em = '👍'; ti = 'Bom trabalho!'; su = 'Estás no bom caminho'; }
  else { em = '🏆'; ti = 'Perfeito!'; su = 'Desempenho impecável'; }
  setTxt('rEmo', em);
  setTxt('rTit', ti);
  setTxt('rSub', su);
  setTxt('rSc', S.score);
  setTxt('rCo', S.correct + '/' + S.totalQ);
  setTxt('rTi', el + 's');
  delete document.body.dataset.game;
  go('res');
}

function replay() {
  startG(S.game);
}

function exitGame() {
    clearInterval(S.timer);
    S.timer = null;
    clearTimeout(S.reactTO);
    S.ended = true;   // ← NOVO: cancela submits/atrasos pendentes
    S.sim = false;
    delete document.body.dataset.game;
    go('home');
}

/* ============ SIMULAÇÃO ============ */
function startSim() {
  S.sim = true; S.simI = 0; S.simStart = Date.now(); S.simTotalScore = 0; S.simGameScores = [];
  go('sim');
  renderSimTransition();
  clearInterval(S.simTimer);
  S.simTimer = setInterval(() => {
    const e = Math.floor((Date.now() - S.simStart) / 1000);
    const t = document.getElementById('simGlobalTimer');
    if (t) t.textContent = fmtTime(e);
  }, 1000);
}

function renderSimHeader() {
    const g = SIM_GAMES[S.simI];
    const segs = SIM_GAMES.map((game, i) => {
        let cls = 'sim-seg';
        let check = '';
        if (i < S.simI) { cls += ' done'; check = '<div class="sim-seg-check"><i class="bi bi-check"></i></div>'; }
        else if (i === S.simI) { cls += ' current'; }
        return `<div class="${cls}">${game.i}${check}</div>`;
    }).join('');
    return `<div class="sim-header">
        <div class="sim-header-top">
            <div class="sim-header-info">
                <div class="sim-header-label">Simulação de Exame</div>
                <h3 class="sim-header-title">${g.n}</h3>
                <p class="sim-header-sub">Jogo ${S.simI + 1} de ${SIM_GAMES.length}</p>
            </div>
            <div class="sim-timer-box">
                <div class="sim-timer-v" id="simGlobalTimer">00:00</div>
                <div class="sim-timer-l">Tempo total</div>
            </div>
        </div>
        <div class="sim-progress-seg">${segs}</div>
    </div>`;
}

function renderSimTransition() {
    const g = SIM_GAMES[S.simI];
    const content = document.getElementById('simContent');
    content.innerHTML = `${renderSimHeader()}
    <div class="sim-transition">
        <div class="sim-transition-num">Jogo ${S.simI + 1} de ${SIM_GAMES.length}</div>
        <div class="sim-transition-ico" style="background:${g.c}">${g.i}</div>
        <h3 class="sim-transition-title">${g.n}</h3>
        <p class="sim-transition-desc">${g.d}</p>
        <div class="sim-transition-meta">
            <span><i class="bi bi-list-ol"></i> ${S.totalQ} perguntas</span>
            <span><i class="bi bi-clock"></i> ${g.t}s</span>
            <span><i class="bi bi-speedometer2"></i> ${['', 'Fácil', 'Médio', 'Difícil'][S.diff]}</span>
        </div>
        <button class="sim-transition-btn" onclick="startSimNow('${g.id}')">
            <i class="bi bi-play-fill"></i> Começar este jogo
        </button>
    </div>`;
}

function startSimTm() {
    clearInterval(S.timer);
    S.timer = null;
    if (S.time <= 0) { endSimG(); return; }   // ✅
    updSimTm();
    S.timer = setInterval(() => {
        S.time--;
        updSimTm();
        if (S.time <= 0) {
            clearInterval(S.timer);
            S.timer = null;
            endSimG();   // ✅
        }
    }, 1000);
}

function updSimTm() {
  const e = document.getElementById('simGTimer');
  if (!e) return;
  e.textContent = S.time;
  e.classList.toggle('warn', S.time <= 10);
}

function nextSimQ() {
  if (S.ended) return;  // ✅ BUG FIX: se o jogo já terminou, não continua
  if (S.q >= S.totalQ || S.time <= 0) { endSimG(); return; }
  S.q++; S.sel = null; S.ans = null;
  const qn = document.getElementById('simQN');
  const qp = document.getElementById('simQP');
  if (qn) qn.textContent = S.q;
  if (qp) qp.style.width = ((S.q - 1) / S.totalQ * 100) + '%';
  const a = document.getElementById('simGArea');
  a.classList.remove('fade-in'); void a.offsetWidth; a.classList.add('fade-in');

  const gen = {
      fig: gFig, num: gNum, mem: gMem, rea: gRea, mat: gMat,
      log: gLog, ana: gAna, rot: gRot, dom: gDom, tel: gTel   // ← NOVO
  }[S.game];

  if (gen) gen(a);
}

function submitSimAns() {
  if (S.ended) return;  // ✅ BUG FIX: se o jogo já terminou, ignora submissões
  if (S.game !== 'rea' && S.game !== 'mem' && S.sel === null) { toast('⚠️ Seleciona uma resposta', 'aw'); return; }
  clearInterval(S.timer);
  clearTimeout(S.reactTO);
  let ok = false;
  if (S.game === 'rea') {
    if (S.reactionTime !== null) {
      const th = [600, 400, 250][S.diff - 1];
      ok = S.reactionTime < th;
      if (ok) { const b = Math.max(5, Math.floor((th - S.reactionTime) / 10)); S.score += b * S.diff; }
    }
  } else {
    ok = (S.sel === S.ans);
    if (ok) S.score += 10 * S.diff;
  }
  if (ok) {
    S.correct++; D.cs++;
    if (D.cs > D.bs) D.bs = D.cs;
    toast('✓ Correto! +' + (10 * S.diff) + ' pts', 'ok');
  } else {
    D.cs = 0;
    toast('✗ Resposta errada', 'aw');
  }
  const gs = document.getElementById('simGScore');
  if (gs) gs.textContent = S.score;
  setTimeout(() => {
      if (S.ended) return;
      if (S.time > 0 && S.q < S.totalQ) { startSimTm(); nextSimQ(); }  // ✅ BUG FIX: verificar se há mais perguntas
      else endSimG();
  }, 900);
}

function skipSimQ() {
  D.cs = 0;
  clearInterval(S.timer);
  clearTimeout(S.reactTO);
  startSimTm();
  nextSimQ();
}

function endSimG() {
  clearInterval(S.timer);
  clearTimeout(S.reactTO);
  clearMemTimeouts();
  if (S.ended) return;   // já terminou → não repete
  S.ended = true;        // marca como terminado
  const el = Math.floor((Date.now() - S.start) / 1000);
  if (!D.gp.includes(S.game)) { D.gp.push(S.game); D.ug = D.gp.length; }
  if (S.diff === 3) D.hg++;
  if (S.correct === S.totalQ) D.pg++;
  if (S.game === 'rea' && S.reactionTime && S.reactionTime < D.br) D.br = S.reactionTime;
  D.h.push({ g: S.game, s: S.score, c: S.correct, t: S.totalQ, d: S.diff, tm: el, dt: Date.now() });
  if (D.h.length > 100) D.h = D.h.slice(-100);
  S.simGameScores.push({ game: S.game, score: S.score, correct: S.correct });
  S.simTotalScore += S.score;
  saveD();
  S.simI++;
  if (S.simI < SIM_GAMES.length) {
    setTimeout(() => renderSimTransition(), 400);
  } else {
    renderSimComplete();
  }
}

function startSimNow(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  S.game = id;
  S.q = 0;
  S.score = 0;
  S.correct = 0;
  S.time = g.t;
  S.start = Date.now();
  S.sel = null;
  S.ans = null;
  S.ended = false; // marca como não terminado
  const content = document.getElementById('simContent');
  content.innerHTML = `${renderSimHeader()}
<div class="sim-game-area">
  <div class="sim-game-header">
    <div class="sim-game-info">
      <div class="sim-game-ico" style="background:${g.c}">${g.i}</div>
      <div>
        <div class="sim-game-name">${g.n}</div>
        <div class="sim-game-q">Pergunta <span id="simQN">1</span>/<span id="simQT">${S.totalQ}</span></div>
      </div>
    </div>
    <div class="sim-game-meta">
      <div class="sim-game-score" title="Pontos">
        <i class="bi bi-star-fill"></i>
        <span id="simGScore">0</span>
      </div>
      <div class="sim-game-timer" id="simGTimer">${S.time}</div>
    </div>
  </div>
  <div class="prog mb-3"><div class="bar" id="simQP" style="width:0%"></div></div>
  <div id="simGArea" class="card-c"></div>
  <div class="d-flex gap-2 mt-3" id="simGActs" style="display:${(id === 'rea' || id === 'mem') ? 'none' : 'flex'}">
    <button class="btn-p flex-grow-1" onclick="submitSimAns()">Confirmar</button>
    <button class="btn-o" onclick="skipSimQ()">Saltar</button>
  </div>
</div>`;
  startSimTm();
  nextSimQ();
}

function renderSimComplete() {
  D.sm++;
  D.simHistory.push({ score: S.simTotalScore, difficulty: S.diff, date: Date.now(), games: S.simGameScores.slice() });
  if (D.simHistory.length > 20) D.simHistory = D.simHistory.slice(-20);
  saveD(); checkAch();
  clearInterval(S.simTimer);
  S.sim = false;
  const totalTime = Math.floor((Date.now() - S.simStart) / 1000);
  const totalCorrect = S.simGameScores.reduce((a, x) => a + x.correct, 0);
  const totalQ = S.simGameScores.length * 10;
  const pct = Math.round(totalCorrect / totalQ * 100);
  let rankTitle = '🌱 Iniciante', rankDesc = 'Continua a praticar!';
  if (pct >= 90) { rankTitle = '🏆 Mestre'; rankDesc = 'Resultado excecional!'; }
  else if (pct >= 75) { rankTitle = '⭐ Avançado'; rankDesc = 'Excelente desempenho!'; }
  else if (pct >= 60) { rankTitle = '👍 Intermédio'; rankDesc = 'Bom trabalho!'; }
  else if (pct >= 40) { rankTitle = '📚 Aprendiz'; rankDesc = 'Continua a treinar!'; }
  const best = D.simHistory.length > 0 ? Math.max.apply(null, D.simHistory.map(s => s.score)) : S.simTotalScore;
  const isRecord = S.simTotalScore >= best;
  const gamesBreakdown = S.simGameScores.map(gs => {
    const game = GAMES.find(g => g.id === gs.game);
    const gamePct = Math.round(gs.correct / 10 * 100);
    return '<div style="display:flex;align-items:center;gap:.75rem;padding:.6rem;background:var(--bg);border-radius:10px;margin-bottom:.4rem;border:1px solid var(--border)">' +
      '<div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff;background:' + game.c + ';flex-shrink:0">' + game.i + '</div>' +
      '<div style="flex:1"><div style="font-weight:600;font-size:.9rem">' + game.n + '</div>' +
      '<div style="font-size:.75rem;color:var(--text-muted)">' + gs.correct + '/10 • ' + gamePct + '%</div></div>' +
      '<div style="font-weight:700;color:var(--primary)">' + gs.score + '</div></div>';
  }).join('');
  const content = document.getElementById('simContent');
  content.innerHTML = '<div class="sim-complete">' +
    '<div class="sim-complete-ico">' + (isRecord ? '🏆' : '🎉') + '</div>' +
    '<h2 class="sim-complete-title">Simulação Concluída!</h2>' +
    '<p class="sim-complete-sub">' + rankDesc + '</p>' +
    '<div class="sim-complete-rank"><div class="sim-complete-rank-title">Classificação</div>' +
    '<div class="sim-complete-rank-v">' + rankTitle + ' • ' + pct + '%</div></div>' +
    '<div class="sim-complete-stats">' +
    '<div class="sim-complete-stat"><div class="sim-complete-stat-v">' + S.simTotalScore + '</div><div class="sim-complete-stat-l">Pontos</div></div>' +
    '<div class="sim-complete-stat"><div class="sim-complete-stat-v">' + totalCorrect + '/' + totalQ + '</div><div class="sim-complete-stat-l">Acertos</div></div>' +
    '<div class="sim-complete-stat"><div class="sim-complete-stat-v">' + fmtTime(totalTime) + '</div><div class="sim-complete-stat-l">Tempo</div></div></div>' +
    (isRecord ? '<div class="sim-complete-rank" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><div class="sim-complete-rank-title"><i class="bi bi-trophy-fill"></i> Novo Recorde Pessoal!</div></div>' : '') +
    '<div style="text-align:left;margin-bottom:1.25rem">' +
    '<div style="font-size:.85rem;font-weight:600;margin-bottom:.5rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Desempenho por jogo</div>' +
    gamesBreakdown + '</div>' +
    '<div class="d-flex gap-2">' +
    '<button class="btn-o flex-grow-1" onclick="go(\'home\')">Menu</button>' +
    '<button class="btn-p flex-grow-1" onclick="openSimModal()"><i class="bi bi-arrow-repeat"></i> Repetir</button></div></div>';
  toast('🏆 Simulação concluída! ' + S.simTotalScore + ' pts', 'aw');
}

/* ============ RELATÓRIO COGNITIVO ============ */
const TRAITS = [
    { id: 'logica',     n: 'Raciocínio Lógico',   e: '🧩', games: ['log', 'dom'],  tip: 'Padrões Lógicos e Dominós' },
    { id: 'numerica',   n: 'Aptidão Numérica',    e: '🔢', games: ['num', 'mat'],  tip: 'Sequências Numéricas e Cálculo Mental' },
    { id: 'verbal',     n: 'Raciocínio Verbal',   e: '💬', games: ['ana'],         tip: 'Analogias Verbais' },
    { id: 'espacial',   n: 'Raciocínio Espacial 2D', e: '🔄', games: ['rot', 'fig'],  tip: 'Rotação e Sequências de Figuras' },
    { id: 'telhado',    n: 'Raciocínio Espacial 3D',   e: '🏠', games: ['tel'],         tip: 'Rotação 3D Plantas e Telhados' },
    { id: 'memoria',    n: 'Memória e Atenção',   e: '🎨', games: ['mem'],         tip: 'Memória de Cores' },
    { id: 'velocidade', n: 'Velocidade Mental',   e: '⚡', games: ['rea'],         tip: 'Tempo de Reação' },
    { id: 'analitica', n: 'Raciocínio Analítico', e: '🔍', games: ['ana', 'dom'], tip: 'Analogia e Dominós' }
];

const SKILL_GAMES = ['fig', 'num', 'mem', 'rea', 'mat', 'log', 'ana', 'rot', 'dom', 'tel'];

function calcTraits() {
    // Precisão média por jogo, ajustada à dificuldade
    const perf = {};
    SKILL_GAMES.forEach(id => perf[id] = []);
    D.h.forEach(h => {
        if (!perf[h.g]) return;
        const acc = h.t > 0 ? h.c / h.t : 0;
        perf[h.g].push(Math.min(1, acc * (0.85 + 0.15 * h.d))); // d1: x1.0 | d2: x1.15 | d3: x1.3
    });
    // 🔍 DEBUG: mostrar dados detalhados de 'tel'
    if (perf['tel'] && perf['tel'].length > 0) {
        const telRecords = D.h.filter(h => h.g === 'tel');
        console.log('📊 Histórico de Rotação 3D (tel):');
        telRecords.forEach((h, i) => {
            const acc = h.t > 0 ? h.c / h.t : 0;
            const adjusted = Math.min(1, acc * (0.85 + 0.15 * h.d));
            console.log(`  ${i+1}. ${h.c}/${h.t} (${(acc*100).toFixed(0)}%) • Dif=${h.d} • Ajustado=${(adjusted*100).toFixed(0)}%`);
        });
        const media = perf['tel'].reduce((a,b)=>a+b,0) / perf['tel'].length;
        console.log(`✅ Média final: ${(media*100).toFixed(1)}%`);
    }
    return TRAITS.map(tr => {
        let vals = [];
        tr.games.forEach(g => vals = vals.concat(perf[g]));
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return { ...tr, score: Math.round(avg * 100) };
    });
}

function descTrait(id) {
    const m = {
        logica: 'identificar padrões e relações lógicas',
        numerica: 'manipular números e resolver operações rapidamente',
        verbal: 'compreender relações entre conceitos e vocabulário',
        espacial: 'visualizar e manipular objetos mentalmente',
        memoria: 'reter e reproduzir informação com precisão',
        velocidade: 'processar informação e reagir com rapidez'
    };
    return m[id] || '';
}

function renderCogReport() {
    const box = document.getElementById('cogReport');
    const chartBox = document.getElementById('cogChartBox');
    const locked = document.getElementById('cogLocked');
    const levelEl = document.getElementById('cogLevel');
    if (!box) return;

    // 🔒 Só apresenta após 1 jogo de cada tipo
    const allPlayed = SKILL_GAMES.every(id => D.gp.includes(id));
    if (!allPlayed) {
        const playedCount = SKILL_GAMES.filter(id => D.gp.includes(id)).length;
        const missing = SKILL_GAMES.filter(id => !D.gp.includes(id)).map(id => GAMES.find(g => g.id === id));
        box.style.display = 'none';
        chartBox.style.display = 'none';
        locked.style.display = 'block';
        if (levelEl) levelEl.textContent = `${playedCount}/${SKILL_GAMES.length} jogos`;
        locked.innerHTML = `
            <div style="text-align:center;padding:1.25rem .75rem">
                <div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>
                <div style="font-weight:700;margin-bottom:.35rem">Relatório bloqueado</div>
                <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:1rem;line-height:1.6">
                    Jogaste <strong>${playedCount} de ${SKILL_GAMES.length}</strong> tipos de jogo.<br>
                    Falta experimentar: ${missing.map(g => `<span style="white-space:nowrap">${g.i} ${g.n}</span>`).join(' • ')}
                </div>
                <div class="prog"><div class="bar" style="width:${playedCount / SKILL_GAMES.length * 100}%"></div></div>
            </div>`;
        if (CH.cog) { CH.cog.destroy(); CH.cog = null; }
        return;
    }

    locked.style.display = 'none';
    box.style.display = 'block';

    const traits = calcTraits();
    const overall = Math.round(traits.reduce((a, t) => a + t.score, 0) / traits.length);
    const sorted = [...traits].sort((a, b) => b.score - a.score);
    const best = sorted[0], second = sorted[1];
    const worst = sorted[sorted.length - 1], worst2 = sorted[sorted.length - 2];

    const level = overall >= 80 ? { t: 'Excelente', e: '🏆' }
        : overall >= 60 ? { t: 'Bom', e: '⭐' }
        : overall >= 40 ? { t: 'Em Desenvolvimento', e: '📚' }
        : { t: 'Inicial', e: '🌱' };
    if (levelEl) levelEl.textContent = `${level.e} Nível ${level.t} • ${overall}/100`;

    // 📝 Parágrafo descritivo
    box.innerHTML = `
        <p style="font-size:.92rem;line-height:1.75;margin:0 0 1rem 0">
            O teu perfil cognitivo apresenta um nível global <strong>${level.t.toLowerCase()}</strong>
            (<strong>${overall}/100</strong>). As tuas principais forças são
            <strong>${best.e} ${best.n}</strong> (${best.score}%)${second.score >= 60 ? ` e <strong>${second.e} ${second.n}</strong> (${second.score}%)` : ''},
            indicando boa capacidade de ${descTrait(best.id)}.
            A área com maior margem de progressão é <strong>${worst.e} ${worst.n}</strong> (${worst.score}%)${worst2.score < 50 ? `, seguida de <strong>${worst2.e} ${worst2.n}</strong> (${worst2.score}%)` : ''}.
            Para equilibrar o perfil, recomenda-se treinar mais <strong>${worst.tip}</strong>.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
            ${traits.map(t => `
                <div class="cog-chip">
                    <span>${t.e}</span>
                    <span style="font-weight:600">${t.n}</span>
                    <span style="font-weight:800;color:${t.score >= 70 ? 'var(--success)' : t.score >= 40 ? 'var(--warning)' : 'var(--danger)'}">${t.score}%</span>
                </div>`).join('')}
        </div>`;

    // ⭐ Gráfico radar (estrela)
    chartBox.style.display = 'block';
    if (CH.cog) CH.cog.destroy();
    const dk = D.th === 'dark';
    const tx = dk ? '#f1f5f9' : '#1a1f36';
    const gd = dk ? '#334155' : '#e5e7eb';
    CH.cog = new Chart(document.getElementById('c4').getContext('2d'), {
        type: 'radar',
        data: {
            labels: traits.map(t => t.n),
            datasets: [{
                label: 'Perfil Cognitivo',
                data: traits.map(t => t.score),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,.25)',
                pointBackgroundColor: '#6366f1',
                pointBorderColor: dk ? '#151a2e' : '#ffffff',
                pointRadius: 5,
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            devicePixelRatio: window.devicePixelRatio || 1,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { color: tx, backdropColor: 'transparent', stepSize: 25, font: { size: 13, weight: '600' }, padding: 8 },
                    grid: { color: gd, lineWidth: 1.5 },
                    angleLines: { color: gd, lineWidth: 1 },
                    pointLabels: { 
                        color: tx, 
                        font: { size: 14, weight: '700' }, 
                        padding: 14,
                        display: true,
                        callback: function(label) {
                            const words = label.split(' ');
                            if (words.length <= 2) return label;
                            
                            const midPoint = Math.ceil(words.length / 2);
                            const line1 = words.slice(0, midPoint).join(' ');
                            const line2 = words.slice(midPoint).join(' ');
                            return [line1, line2];
                        }
                    }
                }
            }
        }
    });
}

// 📊 Redimensionar gráfico cognitivo quando a janela mudar
let cogChartTimeout;
window.addEventListener('resize', () => {
    clearTimeout(cogChartTimeout);
    cogChartTimeout = setTimeout(() => {
        if (CH.cog && document.getElementById('cogChartBox').style.display !== 'none') {
            CH.cog.resize();
        }
    }, 150);
});

/* ============ ESTATÍSTICAS ============ */
let CH = {};
function renderPsyStats() {
  const container = document.getElementById('psyStatsContainer');
  const chartBox = document.getElementById('psyChartBox');
  if (!container) return;
  if (D.psyProfiles.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem 1rem;color:var(--text-muted)">' +
      '<div style="font-size:3rem;margin-bottom:.75rem">🧠</div>' +
      '<div style="font-weight:600;margin-bottom:.25rem">Ainda não fizeste o teste</div>' +
      '<div style="font-size:.85rem">Completa o teste de Perfil Psicológico para ver as tuas estatísticas</div></div>';
    if (chartBox) chartBox.style.display = 'none';
    return;
  }
  /* testes inválidos (manipulados) são excluídos do perfil dominante */
  const validEntries = D.psyProfiles.filter(p => p.validity !== 'invalid');
  const excluded = D.psyProfiles.length - validEntries.length;
  const base = validEntries.length > 0 ? validEntries : D.psyProfiles;
  
  // O perfil dominante é o do ÚLTIMO teste, não a agregação de todos
  const lastEntry = base.length > 0 ? base[base.length - 1] : D.psyProfiles[D.psyProfiles.length - 1];
  const dominant = lastEntry.profile;
  const dominantProfile = PSY_PROFILES[dominant];
  
  // A distribuição mostra o do ÚLTIMO teste (não o histórico agregado)
  let counts = lastEntry.counts || null;
  if (!counts) {
    // Para dados antigos sem counts, criar um com 1 no perfil dominante
    counts = { lider: 0, analit: 0, social: 0, criat: 0, exec: 0 };
    counts[dominant] = 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  
  const last = D.psyProfiles[D.psyProfiles.length - 1];
  const lastProfileData = PSY_PROFILES[last.profile];
  const lastV = last.validity || 'ok';
  const lastVi = PSY_VALIDITY[lastV];
  
  /* HTML melhorado com destaque no perfil dominante e informações de competências */
  container.innerHTML =
    '<div class="psy-stats-dominant">' +
    '<div class="psy-stats-dominant-top">' +
    '<div class="psy-stats-dominant-emoji">' + dominantProfile.emoji + '</div>' +
    '<div class="psy-stats-dominant-info">' +
    '<div class="psy-stats-dominant-label">Perfil Dominante</div>' +
    '<div class="psy-stats-dominant-name" style="color:' + dominantProfile.color + '">' + dominantProfile.name + '</div>' +
    '<div class="psy-stats-dominant-count">' + counts[dominant] + ' de ' + total + ' (' + Math.round(counts[dominant] / total * 100) + '%)</div>' +
    '</div></div>' +
    '<div class="psy-stats-dominant-features">' +
    '<div class="psy-stats-feature-box">' +
    '<div class="psy-stats-feature-title">💪 Competências</div>' +
    '<div class="psy-stats-feature-list">' +
    dominantProfile.strengths.map(s => '<div class="psy-stats-feature-item">' + s + '</div>').join('') +
    '</div></div>' +
    '<div class="psy-stats-feature-box">' +
    '<div class="psy-stats-feature-title">🎯 Áreas Profissionais</div>' +
    '<div class="psy-stats-feature-list">' +
    dominantProfile.roles.map(r => '<div class="psy-stats-feature-item">' + r + '</div>').join('') +
    '</div></div>' +
    '</div>' +
    '</div>' +
    (excluded > 0 ? '<div class="psy-stats-excluded">🚨 ' + excluded + ' teste(s) excluído(s) por indícios de manipulação</div>' : '') +
    '<div class="psy-stats-last"><div class="psy-stats-last-label">Último resultado</div>' +
    '<div class="psy-stats-last-value"><span>' + lastProfileData.emoji + '</span>' +
    '<span style="color:' + lastProfileData.color + ';font-weight:700">' + lastProfileData.name + '</span>' +
    '<span class="psy-validity-chip" style="color:' + lastVi.color + '">' + lastVi.icon + ' ' + (lastV === 'ok' ? 'Válido' : lastV === 'warn' ? 'Questionável' : 'Inválido') + '</span></div></div>';
  
  // 🍰 Renderizar gráfico pizza com labels nas fatias
  if (chartBox && typeof Chart !== 'undefined') {
    if (CH.psy) CH.psy.destroy();
    chartBox.style.display = 'block';
    const dk = D.th === 'dark';
    const tx = dk ? '#f1f5f9' : '#1a1f36';
    
    const profiles = ['lider', 'analit', 'social', 'criat', 'exec'];
    const chartData = profiles.map(key => counts[key]);
    const chartLabels = profiles.map(key => PSY_PROFILES[key].emoji + ' ' + PSY_PROFILES[key].name);
    const chartColors = profiles.map(key => PSY_PROFILES[key].color);
    
    // Plugin customizado para mostrar percentagens nas fatias
    const percentagePlugin = {
      id: 'percentageLabel',
      afterDraw(chart) {
        const { ctx, data, chartArea: { left, top, width, height } } = chart;
        chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
          const { x, y } = datapoint.tooltipPosition();
          const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
          const pct = total > 0 ? Math.round((data.datasets[0].data[index] / total) * 100) : 0;
          
          // Apenas mostrar percentagem se for > 0%
          if (pct > 0) {
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pct + '%', x, y);
          }
        });
      }
    };
    
    CH.psy = new Chart(document.getElementById('psyChart').getContext('2d'), {
      type: 'doughnut',
      plugins: [percentagePlugin],
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderColor: dk ? '#1c2340' : '#ffffff',
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: { padding: 10 },
        plugins: {
          legend: {
            position: 'right',
            labels: { 
              color: tx, 
              font: { size: 12, weight: '600' }, 
              padding: 15,
              usePointStyle: true,
              boxHeight: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 11 },
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a,b) => a+b, 0);
                const pct = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                return context.label + ': ' + context.parsed + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }
}
function renderStats() {
  document.getElementById('sSc').textContent = D.ts;
  document.getElementById('sGm').textContent = D.tg;
  document.getElementById('sSt').textContent = D.streak || 0;
  let tc = 0, tq = 0;
  D.h.forEach(h => { tc += h.c; tq += h.t; });
  document.getElementById('sAc').textContent = (tq > 0 ? Math.round(tc / tq * 100) : 0) + '%';
  renderCH();
  renderPsyStats();
  renderNotifSettings();
  renderCogReport();
}
function renderCH() {
  Object.values(CH).forEach(c => { if (c) c.destroy(); });
  CH = {};
  if (typeof Chart === 'undefined') return;
  const dk = D.th === 'dark';
  const tx = dk ? '#f1f5f9' : '#1a1f36';
  const gd = dk ? '#334155' : '#e5e7eb';
  const h = D.h.slice(-20);
  const o = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: tx } } },
    scales: { x: { ticks: { color: tx }, grid: { color: gd } }, y: { ticks: { color: tx }, grid: { color: gd } } }
  };
  const c1 = document.getElementById('c1');
  if (c1 && h.length > 0) {
    CH.e = new Chart(c1.getContext('2d'), {
      type: 'line',
      data: {
        labels: h.map((_, i) => '#' + (i + 1)), datasets: [{
          label: 'Pontos', data: h.map(x => x.s),
          borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.15)', tension: .3, fill: true
        }]
      }, options: o
    });
  }
  const gs = {}; GAMES.forEach(g => gs[g.id] = { t: 0, c: 0 });
  D.h.forEach(x => { if (gs[x.g]) { gs[x.g].t += x.s; gs[x.g].c++; } });
  let totalScore = 0, totalGames = 0;
  D.h.forEach(x => { totalScore += x.s; totalGames++; });
  const avgScoreTotal = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
  const c2 = document.getElementById('c2');
  if (c2) {
    const o2 = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tx } } },
      scales: { x: { ticks: { color: tx }, grid: { display: false } }, y: { ticks: { color: tx }, grid: { color: gd } } }
    };
    CH.g = new Chart(c2.getContext('2d'), {
      type: 'bar',
      data: {
        labels: SKILL_GAMES.map(id => GAMES.find(g => g.id === id).i),
        datasets: [
          {
            label: 'Precisão Média',
            data: SKILL_GAMES.map(id => gs[id].c ? Math.round(gs[id].t / gs[id].c) : 0),
            backgroundColor: SKILL_GAMES.map(id => GAMES.find(g => g.id === id).c), borderRadius: 8
          },
          {
            label: 'Média Total',
            data: SKILL_GAMES.map(() => avgScoreTotal),
            type: 'line',
            borderColor: '#6366f1',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4
          }
        ]
      }, options: o2
    });
  }
  const ts = {}; GAMES.forEach(g => ts[g.id] = { t: 0, c: 0 });
  D.h.forEach(x => { if (ts[x.g]) { ts[x.g].t += x.tm; ts[x.g].c++; } });
  let totalTime = 0, totalCount = 0;
  D.h.forEach(x => { totalTime += x.tm; totalCount++; });
  const avgTimeTotal = totalCount > 0 ? Math.round(totalTime / totalCount) : 0;
  const c3 = document.getElementById('c3');
  if (c3) {
    const o3 = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tx } } },
      scales: { x: { ticks: { color: tx }, grid: { display: false } }, y: { ticks: { color: tx }, grid: { color: gd } } }
    };
    CH.t = new Chart(c3.getContext('2d'), {
      type: 'bar',
      data: {
        labels: SKILL_GAMES.map(id => GAMES.find(g => g.id === id).i),
        datasets: [
          {
            label: 'Tempo (s)',
            data: SKILL_GAMES.map(id => ts[id].c ? Math.round(ts[id].t / ts[id].c) : 0),
            backgroundColor: SKILL_GAMES.map(id => GAMES.find(g => g.id === id).c), borderRadius: 8
          },
          {
            label: 'Tempo Médio Total',
            data: SKILL_GAMES.map(() => avgTimeTotal),
            type: 'line',
            borderColor: '#6366f1',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4
          }
        ]
      }, options: o3
    });
  }
}
function resetStats() {
  if (confirm('Apagar todas as estatísticas?')) {
    try { localStorage.removeItem('pt'); } catch (e) { }
    D = loadD();
    renderStats();
    updHome();
    toast('Estatísticas apagadas', 'ok');
  }
}
/* ============ CONQUISTAS ============ */
function renderAch() {
  document.getElementById('aList').innerHTML = ACHS.map(a => {
    const u = D.a.includes(a.id);
    return '<div class="ach ' + (u ? 'un' : '') + '">' +
      '<div class="ico">' + a.i + '</div>' +
      '<div class="flex-grow-1"><div class="fw-bold">' + a.n + '</div>' +
      '<small class="text-muted">' + a.d + '</small></div>' +
      (u ? '<i class="bi bi-check-circle-fill" style="color:var(--success);font-size:1.3rem"></i>'
        : '<i class="bi bi-lock" style="color:var(--text-muted)"></i>') + '</div>';
  }).join('');
  document.getElementById('aC').textContent = D.a.length;
  document.getElementById('aT').textContent = ACHS.length;
  document.getElementById('aP').style.width = (D.a.length / ACHS.length * 100) + '%';
}
function checkAch() {
  const st = { tg: D.tg, ts: D.ts, bs: D.bs, pg: D.pg, hg: D.hg, sm: D.sm, ug: D.ug, br: D.br, streak: D.streak };
  ACHS.forEach(a => {
    if (!D.a.includes(a.id) && a.f(st)) {
      D.a.push(a.id);
      saveD();
      toast('🏆 ' + a.n + '!', 'aw');
    }
  });
}
/* ============ INIT ============ */
applyTh(D.th);
renderGL();
updHome();
checkDailyStreak();
checkAch();
renderNotifSettings();
if (D.notifEnabled) scheduleDailyNotif();

/* ============ SERVICE WORKER ============ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.error('❌ Erro ao registar Service Worker:', err);
    });
  });
}
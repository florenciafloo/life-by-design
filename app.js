(() => {
  'use strict';

  const STORAGE_KEY = 'lifeByDesign.v1';
  const DAILY_COIN_LIMIT = 40;
  const categories = ['Love & Relationships', 'Wedding & Marriage Planning', 'Independent Living', 'Career & Business', 'Money & Finance', 'Travel & Adventure', 'Health & Wellness', 'Home & Lifestyle', 'Personal Growth'];
  const tasks = [
    { id: 'pause', title: 'Take a mindful moment', detail: 'Pause and check in with yourself.', reward: 5 },
    { id: 'corner', title: 'Make one corner feel lovely', detail: 'A tiny reset counts.', reward: 5 },
    { id: 'look-forward', title: 'Choose something to look forward to', detail: 'It can be something small.', reward: 5 }
  ];
  const items = [
    { id: 'plant', name: 'Sunny little plant', icon: '🪴', price: 35, description: 'A leafy friend for your window.', color: '#a7bb8a' },
    { id: 'lamp', name: 'Evening glow lamp', icon: '🏮', price: 45, description: 'Make your room feel extra cozy.', color: '#f9c76f' },
    { id: 'art', name: 'Little daydream print', icon: '🖼️', price: 55, description: 'A gentle reminder to dream.', color: '#efcfb2' },
    { id: 'cushion', name: 'Blush cushion', icon: '🛋️', price: 30, description: 'A soft finishing touch.', color: '#eaaf9d' },
    { id: 'flowers', name: 'Market flowers', icon: '💐', price: 40, description: 'A pop of color for your home.', color: '#d7b89a' },
    { id: 'star-rug', name: 'Starry rug', icon: '🌙', price: 65, description: 'A little magic underfoot.', color: '#d9c86f' }
  ];
  const rewards = [
    { id: 'coffee', name: 'A little coffee treat', type: 'Coffee & food', icon: '☕', cost: 80 },
    { id: 'wellness', name: 'Wellness class pass', type: 'Health & wellness', icon: '🧘', cost: 120 },
    { id: 'stationery', name: 'Happy pages stationery', type: 'Stationery', icon: '📒', cost: 100 }
  ];
  const roomInfo = {
    living: { name: 'Living room', icon: '🛋️', className: 'room-living' },
    bedroom: { name: 'Bedroom', icon: '🛏️', className: 'room-bedroom' },
    kitchen: { name: 'Kitchen', icon: '🍵', className: 'room-kitchen' }
  };
  const defaults = {
    coins: 120, xp: 0, view: 'home', room: 'living', selectedFurniture: null,
    categories: ['Health & Wellness', 'Home & Lifestyle', 'Personal Growth'],
    completed: {}, activityDays: {}, owned: ['plant', 'lamp'],
    plans: [
      { id: 'p1', title: 'Take a slow morning walk', date: 'Today', time: '8:30 AM' },
      { id: 'p2', title: 'A little time for myself', date: 'Tomorrow', time: '6:00 PM' }
    ],
    goals: [{ id: 'g1', title: 'Make space for a slower morning', done: false }],
    journal: '', transactions: [{ label: 'Welcome bonus', amount: 120, date: dateKey() }], redemptions: [],
    avatar: { living: { x: 50, y: 66 }, bedroom: { x: 50, y: 66 }, kitchen: { x: 50, y: 66 } },
    roomLayouts: {
      living: [{ id: 'plant', x: 18, y: 23 }, { id: 'lamp', x: 73, y: 25 }],
      bedroom: [], kitchen: []
    }
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let toastTimer;
  let dragState = null;
  let state = loadState();

  function dateKey(date = new Date()) { return date.toISOString().slice(0, 10); }
  function freshDefaults() { return JSON.parse(JSON.stringify(defaults)); }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const result = { ...freshDefaults(), ...(saved || {}) };
      result.avatar = { ...freshDefaults().avatar, ...(saved?.avatar || {}) };
      result.roomLayouts = { ...freshDefaults().roomLayouts, ...(saved?.roomLayouts || {}) };
      result.activityDays = saved?.activityDays || {};
      result.completed = saved?.completed || {};
      // Migrate room placements from the previous prototype.
      if (saved?.roomLayout && !saved?.roomLayouts) result.roomLayouts.living = saved.roomLayout;
      Object.keys(roomInfo).forEach(room => { if (!Array.isArray(result.roomLayouts[room])) result.roomLayouts[room] = []; });
      Object.keys(roomInfo).forEach(room => {
        if (!result.avatar[room] || typeof result.avatar[room] !== 'object') result.avatar[room] = { x: 50, y: 66 };
      });
      return result;
    } catch { return freshDefaults(); }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { notify('Could not save in this browser.'); }
    updateHeader();
  }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function id() { return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function snap(n) { return Math.round(n / 10) * 10; }
  function levelInfo() { const level = Math.floor(state.xp / 100) + 1; return { level, progress: state.xp % 100, next: level * 100 }; }
  function updateHeader() {
    const balance = document.getElementById('coinBalance');
    const date = document.getElementById('todayLabel');
    if (balance) balance.textContent = Number(state.coins).toLocaleString('id-ID');
    if (date) date.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function notify(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
  }
  function navigate(view) {
    state.view = view;
    state.selectedFurniture = null;
    save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function item(id) { return items.find(entry => entry.id === id); }
  function isDone(taskId) { return Boolean(state.completed[`${dateKey()}:${taskId}`]); }
  function todayEarned() { return state.transactions.filter(t => t.date === dateKey() && t.amount > 0).reduce((n, t) => n + t.amount, 0); }
  function awardXp(amount) { state.xp = Math.max(0, state.xp + amount); }
  function earnCoins(label, amount) {
    const allowed = Math.max(0, DAILY_COIN_LIMIT - todayEarned());
    const granted = Math.min(amount, allowed);
    if (!granted) { notify('You’ve reached today’s coin limit. Take a gentle break 🌿'); return 0; }
    state.coins += granted;
    state.transactions.unshift({ label, amount: granted, date: dateKey() });
    awardXp(granted * 2);
    state.activityDays[dateKey()] = true;
    return granted;
  }
  function streakCount() {
    let count = 0;
    const cursor = new Date();
    // A missed day is okay; show a streak only if today or yesterday has activity.
    if (!state.activityDays[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (state.activityDays[dateKey(cursor)]) { count++; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }
  function achievementData() {
    const completedCount = Object.values(state.completed).filter(Boolean).length;
    const doneGoals = state.goals.filter(goal => goal.done).length;
    const definitions = [
      { id: 'first-step', icon: '🌱', title: 'First little win', detail: 'Complete an activity', earned: completedCount >= 1 },
      { id: 'planner', icon: '🗓️', title: 'Making room', detail: 'Add 3 plans', earned: state.plans.length >= 3 },
      { id: 'homebody', icon: '🏡', title: 'Home sweet home', detail: 'Collect 4 decor items', earned: state.owned.length >= 4 },
      { id: 'goal-getter', icon: '✨', title: 'In your own time', detail: 'Complete a personal goal', earned: doneGoals >= 1 },
      { id: 'steady', icon: '🌼', title: 'A little rhythm', detail: 'Show up 3 days', earned: streakCount() >= 3 }
    ];
    return definitions.map(badge => ({ ...badge, earned: badge.earned || Boolean(state.achievements?.[badge.id]) }));
  }
  function taskRow(task) {
    const done = isDone(task.id);
    return `<div class="task"><button class="check ${done ? 'done' : ''}" data-action="complete-task" data-id="${task.id}" aria-label="${done ? 'Completed' : 'Complete'} ${esc(task.title)}">${done ? '✓' : ''}</button><div class="task-title">${esc(task.title)}<small>${esc(task.detail)}</small></div><span class="reward-tag">${done ? 'Done' : `+${task.reward} coins`}</span></div>`;
  }
  function planRow(plan, index = 0, removable = false) {
    const day = plan.date === 'Today' ? '12' : plan.date === 'Tomorrow' ? '13' : String(14 + index);
    return `<div class="plan-row"><div class="plan-date"><b>${day}</b>${esc(plan.date)}</div><div class="plan-copy"><strong>${esc(plan.title)}</strong><small>${esc(plan.time)}</small></div>${removable ? `<button class="btn ghost small" data-action="delete-plan" data-id="${esc(plan.id)}" aria-label="Remove plan">×</button>` : ''}</div>`;
  }
  function categoryButtons() {
    return categories.map(value => {
      const selected = state.categories.includes(value);
      return `<button class="category ${selected ? 'selected' : ''}" data-action="toggle-category" data-category="${esc(value)}" aria-pressed="${selected}">${selected ? '✓ ' : ''}${esc(value)}</button>`;
    }).join('');
  }
  function roomMarkup() {
    const currentRoom = roomInfo[state.room] ? state.room : 'living';
    const avatar = state.avatar[currentRoom] || { x: 50, y: 66 };
    const placed = (state.roomLayouts[currentRoom] || []).map(slot => {
      const furniture = item(slot.id);
      if (!furniture || !state.owned.includes(slot.id)) return '';
      return `<button class="room-furniture ${state.selectedFurniture === slot.id ? 'selected' : ''}" data-item-id="${slot.id}" aria-label="Move ${esc(furniture.name)}" style="left:${slot.x}%;top:${slot.y}%;--furniture:${furniture.color}">${furniture.icon}</button>`;
    }).join('');
    const sceneRoom = roomInfo[currentRoom];
    return `<div class="room-scene ${sceneRoom.className}" id="roomEditor" data-room="${currentRoom}" aria-label="${esc(sceneRoom.name)} editor">
      <div class="room-window"></div><div class="room-floor"></div><div class="room-rug"></div><div class="room-sofa"></div><div class="room-plant">🌿</div><div class="room-lamp">🪑</div><div class="room-deco">💛</div>
      ${placed}<div class="avatar-player" id="avatar" style="left:${avatar.x}%;top:${avatar.y}%" aria-label="Your avatar" role="img"><span class="avatar-body">🧸</span></div>
    </div>`;
  }
  function homeView() {
    const { level, progress } = levelInfo();
    const done = tasks.filter(task => isDone(task.id)).length;
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow">A little space for your life</div><h1>Your life, your way.</h1><p class="subtle">Make a plan, celebrate a small win, or simply take a breath. Your version of a good life is yours to design.</p><button class="btn" data-navigate="life">Explore My Life →</button></div></section>
      <div class="grid grid-3"><div class="card stat-card"><span class="stat-icon">🟡</span><div><strong>${state.coins.toLocaleString('id-ID')}</strong><small>LIFE COINS</small></div></div><div class="card stat-card"><span class="stat-icon">🌱</span><div><strong>${done}/${tasks.length}</strong><small>TODAY'S LITTLE WINS</small></div></div><div class="card stat-card"><span class="stat-icon">🏆</span><div><strong>Lv ${level}</strong><small>${progress}% TO NEXT LEVEL</small></div></div></div>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">A gentle nudge</div><h2>Today, at your pace</h2></div><span>☀️</span></div><p class="subtle">Little things count. Pick what feels good today—there’s no perfect streak to keep.</p>${tasks.map(taskRow).join('')}</section>
      <section class="card"><div class="card-head"><div><div class="eyebrow">Your cozy corner</div><h2>My World</h2></div><button class="btn sage small" data-navigate="world">Decorate</button></div>${roomMarkup()}<div class="room-hint">Your room is waiting for you 🌷</div></section></div>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">Coming up</div><h2>Your plans</h2></div><button class="btn ghost small" data-navigate="life">Open planner</button></div>${state.plans.length ? state.plans.slice(0, 3).map(planRow).join('') : '<div class="empty">A blank day can be a lovely plan, too.</div>'}</section><section class="card"><div class="eyebrow">Your choices</div><h2>What matters to you</h2><p class="subtle">Your interests can change whenever you do.</p>${state.categories.map(value => `<span class="chip">${esc(value)}</span>`).join('')}</section></div>`;
  }
  function lifeView() {
    const plans = state.plans.length ? state.plans.map((plan, i) => planRow(plan, i, true)).join('') : '<div class="empty">No plans yet. Add something small to look forward to.</div>';
    const goals = state.goals.length ? state.goals.map(goal => `<div class="task"><button class="check ${goal.done ? 'done' : ''}" data-action="toggle-goal" data-id="${esc(goal.id)}">${goal.done ? '✓' : ''}</button><div class="task-title">${esc(goal.title)}<small>A personal goal, on your terms.</small></div><button class="btn ghost small" data-action="delete-goal" data-id="${esc(goal.id)}">×</button></div>`).join('') : '<div class="empty">No goals yet. Start with one that feels right.</div>';
    return `<div class="eyebrow">Your practical, personal space</div><h1>My Life</h1><p class="subtle">Make plans that fit your life—not someone else’s checklist.</p>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">Personal planner</div><h2>Things to look forward to</h2></div><span>🗓️</span></div>${plans}<form id="planForm" class="form-row"><input class="field" name="title" placeholder="Add a plan…" required maxlength="70"><button class="btn" type="submit">Add</button></form></section>
      <section class="card"><div class="eyebrow">Everyday activities</div><h2>Small steps, your way</h2>${tasks.map(taskRow).join('')}<p class="fine-print">Daily coin earning is capped at ${DAILY_COIN_LIMIT}. Journaling never earns coins.</p></section></div>
      <div class="grid grid-2 section"><section class="card"><div class="eyebrow">Custom goals</div><h2>Make it your own</h2>${goals}<form id="goalForm" class="form-row"><input class="field" name="title" placeholder="A goal that matters to you…" required maxlength="90"><button class="btn" type="submit">Add goal</button></form></section>
      <section class="card"><div class="eyebrow">Private by default</div><h2>A note to yourself</h2><p class="subtle">This reflection stays in this browser in this prototype. It does not earn coins.</p><textarea id="journal" class="field" maxlength="4000" placeholder="What would you like to remember about today?">${esc(state.journal)}</textarea><div style="margin-top:10px"><button class="btn sage" data-action="save-journal">Save reflection</button></div></section></div>
      <section class="card section"><div class="eyebrow">A flexible life</div><h2>Your focus can change</h2><p class="subtle">Choose the areas you want to make room for right now.</p><div class="category-grid">${categoryButtons()}</div></section>`;
  }
  function worldView() {
    const roomTabs = Object.entries(roomInfo).map(([key, room]) => `<button class="room-tab ${state.room === key ? 'active' : ''}" data-action="select-room" data-room="${key}">${room.icon} ${room.name}</button>`).join('');
    const inventory = state.owned.map(itemId => item(itemId)).filter(Boolean);
    const placedIds = (state.roomLayouts[state.room] || []).map(slot => slot.id);
    const inventoryHtml = inventory.length ? inventory.map(furniture => `<button class="inventory-item ${placedIds.includes(furniture.id) ? 'placed' : ''}" data-action="place-item" data-id="${furniture.id}" title="${placedIds.includes(furniture.id) ? 'Already in room' : 'Add to room'}"><span>${furniture.icon}</span><small>${esc(furniture.name)}</small>${placedIds.includes(furniture.id) ? '<b>✓</b>' : '<b>＋</b>'}</button>`).join('') : '<div class="empty">No decor yet. Visit the shop below to find your first piece.</div>';
    const achievementMarkup = achievementData().map(badge => `<div class="badge-card ${badge.earned ? 'earned' : 'locked'}"><span>${badge.icon}</span><div><strong>${esc(badge.title)}</strong><small>${badge.earned ? 'Collected!' : esc(badge.detail)}</small></div></div>`).join('');
    const { level, progress, next } = levelInfo();
    return `<div class="eyebrow">A little world that feels like you</div><h1>My World</h1><p class="subtle">Arrange your rooms, move your little avatar, and make a home that feels like yours.</p>
      <section class="card editor-card section"><div class="editor-heading"><div><div class="eyebrow">Your home · Level ${level}</div><h2>${roomInfo[state.room].name}</h2></div><div class="editor-tools"><button class="btn ghost small" data-action="reset-room">Reset layout</button></div></div>
      <div class="room-tabs">${roomTabs}</div>${roomMarkup()}<div class="room-hint"><span>✦</span> Drag furniture to move it. Tap an empty spot to walk there. Use arrow keys or WASD.</div></section>
      <div class="grid grid-2 section"><section class="card"><div class="eyebrow">Your collection</div><h2>Room inventory</h2><p class="subtle">Tap a piece to place it in this room. Drag it to find its perfect spot.</p><div class="inventory-grid">${inventoryHtml}</div></section>
      <section class="card"><div class="eyebrow">Your journey</div><h2>Growing at your pace</h2><div class="level-row"><div class="level-medal">${level}</div><div class="level-copy"><strong>Level ${level}</strong><small>${state.xp} total XP · ${next - state.xp} XP to level ${level + 1}</small></div></div><div class="xp-bar"><span style="width:${progress}%"></span></div><div class="streak-note">🌼 ${streakCount()} day${streakCount() === 1 ? '' : 's'} of activity · No streak pressure, just a gentle reflection.</div></section></div>
      <section class="section"><div class="card-head"><div><div class="eyebrow">Little things for your home</div><h2>Decor shop</h2></div><span class="chip">🟡 ${state.coins} coins</span></div><div class="store-grid">${items.map(furniture => { const owned = state.owned.includes(furniture.id); return `<article class="store-item"><div class="item-art">${furniture.icon}</div><strong>${esc(furniture.name)}</strong><p>${esc(furniture.description)}</p><button class="btn small ${owned ? 'sage' : ''}" data-action="buy-decor" data-id="${furniture.id}" ${owned ? 'disabled' : ''}>${owned ? 'In your collection' : `🟡 ${furniture.price} coins`}</button></article>`; }).join('')}</div></section>
      <section class="card section"><div class="card-head"><div><div class="eyebrow">Little celebrations</div><h2>Achievements</h2></div><span>🏅</span></div><div class="badge-grid">${achievementMarkup}</div></section>`;
  }
  function rewardsView() {
    const history = state.transactions.slice(0, 7);
    return `<div class="eyebrow">Small celebrations, thoughtfully earned</div><h1>Rewards</h1><p class="subtle">Real-world reward examples are simulated in this demo. No voucher is active.</p><div class="grid grid-3 section"><div class="card stat-card"><span class="stat-icon">🟡</span><div><strong>${state.coins}</strong><small>AVAILABLE COINS</small></div></div><div class="card stat-card"><span class="stat-icon">🎁</span><div><strong>${state.redemptions.length}</strong><small>DEMO REDEMPTIONS</small></div></div><div class="card stat-card"><span class="stat-icon">🌱</span><div><strong>${Math.max(0, DAILY_COIN_LIMIT - todayEarned())}</strong><small>COINS AVAILABLE TODAY</small></div></div></div>
      <div class="grid grid-2 section"><section class="card"><div class="eyebrow">Sample voucher ideas</div><h2>A little something nice</h2><p class="subtle">Examples only—no brand partnership or real voucher is active.</p>${rewards.map(reward => { const redeemed = state.redemptions.includes(reward.id); return `<div class="voucher"><span class="voucher-icon">${reward.icon}</span><div class="voucher-copy"><strong>${esc(reward.name)}</strong><small>${esc(reward.type)} · Demo reward</small></div><button class="btn small ${redeemed ? 'sage' : ''}" data-action="redeem" data-id="${reward.id}" ${redeemed ? 'disabled' : ''}>${redeemed ? 'Redeemed' : `🟡 ${reward.cost}`}</button></div>`; }).join('')}</section>
      <section class="card"><div class="eyebrow">Your coin story</div><h2>Recent activity</h2>${history.length ? history.map(t => `<div class="plan-row"><div class="plan-date"><b>${t.amount > 0 ? '+' : '−'}${Math.abs(t.amount)}</b>coins</div><div class="plan-copy"><strong>${esc(t.label)}</strong><small>${esc(t.date)}</small></div></div>`).join('') : '<div class="empty">Your coin story starts with your next little win.</div>'}</section></div><p class="fine-print">Demo only: rewards require secure server-side validation and real partner fulfillment before launch.</p>`;
  }
  function profileView() {
    const { level, progress, next } = levelInfo();
    return `<div class="eyebrow">Your space, your settings</div><h1>Profile</h1><p class="subtle">Your choices belong to you. You can change your interests whenever life shifts.</p><div class="grid grid-2 section"><section class="card"><div class="eyebrow">Your life categories</div><h2>What’s on your mind?</h2><p class="subtle">Select any number. There is no required life path.</p><div class="category-grid">${categoryButtons()}</div></section><section class="card"><div class="eyebrow">Privacy & account</div><h2>Your trust matters</h2><div class="notice">🔒 Journals, reflections, and financial details should be private by default.</div><hr class="divider"><p class="subtle">This prototype stores demo data in this browser only. It has no login or cloud backup.</p><button class="btn ghost" data-action="reset">Reset demo data</button></section></div>
      <section class="card section"><div class="eyebrow">Your progress</div><h2>Level ${level} · ${state.xp} XP</h2><div class="xp-bar"><span style="width:${progress}%"></span></div><div class="mini-row"><span>${progress}/100 XP to next level</span><span>${next - state.xp} XP left</span></div><div class="badge-grid section">${achievementData().map(b => `<div class="badge-card ${b.earned ? 'earned' : 'locked'}"><span>${b.icon}</span><div><strong>${esc(b.title)}</strong><small>${b.earned ? 'Collected!' : esc(b.detail)}</small></div></div>`).join('')}</div></section>`;
  }
  function render() {
    const views = { home: homeView, life: lifeView, world: worldView, rewards: rewardsView, profile: profileView };
    app.innerHTML = (views[state.view] || homeView)();
    document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
    const editor = document.getElementById('roomEditor');
    if (editor) editor.addEventListener('pointerdown', handleRoomPointerDown);
    updateHeader();
  }

  function setAvatarAt(clientX, clientY) {
    const editor = document.getElementById('roomEditor');
    if (!editor) return;
    const rect = editor.getBoundingClientRect();
    const avatar = state.avatar[state.room];
    avatar.x = clamp(snap(((clientX - rect.left) / rect.width) * 100), 8, 92);
    avatar.y = clamp(snap(((clientY - rect.top) / rect.height) * 100), 18, 82);
    const node = document.getElementById('avatar');
    if (node) { node.style.left = `${avatar.x}%`; node.style.top = `${avatar.y}%`; node.classList.add('walking'); setTimeout(() => node.classList.remove('walking'), 360); }
    save();
  }
  function handleRoomPointerDown(event) {
    const furniture = event.target.closest('.room-furniture');
    if (furniture) {
      dragState = { id: furniture.dataset.itemId, room: state.room, node: furniture };
      state.selectedFurniture = dragState.id;
      furniture.classList.add('selected');
      try { furniture.setPointerCapture(event.pointerId); } catch {}
      event.preventDefault();
      return;
    }
    if (event.target.closest('.room-window, .room-sofa, .room-rug, .room-plant, .room-lamp, .room-deco, .avatar-player')) return;
    setAvatarAt(event.clientX, event.clientY);
  }
  document.addEventListener('pointermove', event => {
    if (!dragState) return;
    const editor = document.getElementById('roomEditor');
    if (!editor || state.room !== dragState.room) return;
    const rect = editor.getBoundingClientRect();
    const x = clamp(snap(((event.clientX - rect.left) / rect.width) * 100), 8, 92);
    const y = clamp(snap(((event.clientY - rect.top) / rect.height) * 100), 16, 86);
    const slot = state.roomLayouts[dragState.room].find(entry => entry.id === dragState.id);
    if (!slot) return;
    slot.x = x; slot.y = y;
    const node = editor.querySelector(`.room-furniture[data-item-id="${dragState.id}"]`);
    if (node) { node.style.left = `${x}%`; node.style.top = `${y}%`; }
    save();
  });
  document.addEventListener('pointerup', () => { dragState = null; });

  document.addEventListener('keydown', event => {
    if (state.view !== 'world' || event.target.matches('input,textarea,button')) return;
    const movement = { ArrowLeft: [-5, 0], a: [-5, 0], A: [-5, 0], ArrowRight: [5, 0], d: [5, 0], D: [5, 0], ArrowUp: [0, -5], w: [0, -5], W: [0, -5], ArrowDown: [0, 5], s: [0, 5], S: [0, 5] }[event.key];
    if (!movement) return;
    event.preventDefault();
    const avatar = state.avatar[state.room];
    avatar.x = clamp(snap(avatar.x + movement[0]), 8, 92);
    avatar.y = clamp(snap(avatar.y + movement[1]), 18, 82);
    const node = document.getElementById('avatar');
    if (node) { node.style.left = `${avatar.x}%`; node.style.top = `${avatar.y}%`; node.classList.add('walking'); setTimeout(() => node.classList.remove('walking'), 300); }
    save();
  });

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view], [data-navigate]');
    if (nav) { event.preventDefault(); navigate(nav.dataset.view || nav.dataset.navigate); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id: itemId } = button.dataset;

    if (action === 'complete-task') {
      const key = `${dateKey()}:${itemId}`;
      if (state.completed[key]) return;
      const task = tasks.find(entry => entry.id === itemId);
      if (!task) return;
      state.completed[key] = true;
      const earned = earnCoins(task.title, task.reward);
      save(); render(); if (earned) notify(`Lovely! +${earned} LIFE COINS`);
    } else if (action === 'toggle-category') {
      const category = button.dataset.category;
      state.categories = state.categories.includes(category) ? state.categories.filter(entry => entry !== category) : [...state.categories, category];
      save(); render();
    } else if (action === 'select-room') {
      state.room = button.dataset.room; state.selectedFurniture = null; save(); render();
    } else if (action === 'place-item') {
      const furniture = item(itemId);
      if (!furniture || !state.owned.includes(itemId)) return;
      const layout = state.roomLayouts[state.room];
      if (!layout.some(entry => entry.id === itemId)) layout.push({ id: itemId, x: 50, y: 58 });
      state.selectedFurniture = itemId; save(); render(); notify(`${furniture.name} placed. Drag to arrange it.`);
    } else if (action === 'reset-room') {
      state.roomLayouts[state.room] = [];
      state.selectedFurniture = null; save(); render(); notify('Room cleared. Your furniture is still in inventory.');
    } else if (action === 'buy-decor') {
      const furniture = item(itemId);
      if (!furniture || state.owned.includes(itemId)) return;
      if (state.coins < furniture.price) { notify('Your next little win can help you save for this 🌱'); return; }
      state.coins -= furniture.price; state.owned.push(itemId);
      state.roomLayouts[state.room].push({ id: itemId, x: 50, y: 58 });
      state.transactions.unshift({ label: `Decor: ${furniture.name}`, amount: -furniture.price, date: dateKey() });
      awardXp(20); save(); render(); notify(`${furniture.name} is home! 🏡`);
    } else if (action === 'redeem') {
      const reward = rewards.find(entry => entry.id === itemId);
      if (!reward || state.redemptions.includes(itemId)) return;
      if (state.coins < reward.cost) { notify('Keep going at your own pace—you’ll get there.'); return; }
      state.coins -= reward.cost; state.redemptions.push(itemId);
      state.transactions.unshift({ label: `Demo redemption: ${reward.name}`, amount: -reward.cost, date: dateKey() });
      save(); render(); notify('Demo redemption recorded. This is not a real voucher.');
    } else if (action === 'delete-plan') {
      state.plans = state.plans.filter(plan => plan.id !== itemId); save(); render();
    } else if (action === 'save-journal') {
      state.journal = document.getElementById('journal')?.value || ''; save(); notify('Your reflection is saved in this browser. 💛');
    } else if (action === 'toggle-goal') {
      const goal = state.goals.find(entry => entry.id === itemId);
      if (goal && !goal.done) { goal.done = true; awardXp(20); }
      else if (goal) goal.done = false;
      save(); render();
    } else if (action === 'delete-goal') {
      state.goals = state.goals.filter(goal => goal.id !== itemId); save(); render();
    } else if (action === 'reset') {
      if (confirm('Reset all LIFE, BY DESIGN demo data saved in this browser?')) { localStorage.removeItem(STORAGE_KEY); state = freshDefaults(); save(); render(); notify('A fresh start 🌱'); }
    }
  });

  document.addEventListener('submit', event => {
    if (event.target.id !== 'planForm' && event.target.id !== 'goalForm') return;
    event.preventDefault();
    const form = new FormData(event.target);
    const title = String(form.get('title') || '').trim();
    if (!title) return;
    if (event.target.id === 'planForm') {
      state.plans.push({ id: id(), title, date: 'Soon', time: 'Whenever works for you' });
      save(); render(); notify('Plan added. Something to look forward to ✨');
    } else {
      state.goals.push({ id: id(), title, done: false });
      save(); render(); notify('A goal that’s yours. You’ve got this 🌿');
    }
  });

  render();
  save();
})();

(() => {
  'use strict';

  const STORAGE_KEY = 'lifeByDesign.v1';
  const DAILY_COIN_LIMIT = 40;
  const categories = [
    'Love & Relationships', 'Wedding & Marriage Planning', 'Independent Living',
    'Career & Business', 'Money & Finance', 'Travel & Adventure',
    'Health & Wellness', 'Home & Lifestyle', 'Personal Growth'
  ];
  const tasks = [
    { id: 'pause', title: 'Take a mindful moment', detail: 'Pause and check in with yourself.', reward: 5 },
    { id: 'corner', title: 'Make one corner feel lovely', detail: 'A tiny reset counts.', reward: 5 },
    { id: 'look-forward', title: 'Choose something to look forward to', detail: 'It can be something small.', reward: 5 }
  ];
  const decor = [
    { id: 'plant', name: 'Sunny little plant', icon: '🪴', price: 35, description: 'A leafy friend for your window.' },
    { id: 'lamp', name: 'Evening glow lamp', icon: '🏮', price: 45, description: 'Make your room feel extra cozy.' },
    { id: 'art', name: 'Little daydream print', icon: '🖼️', price: 55, description: 'A gentle reminder to dream.' },
    { id: 'cushion', name: 'Blush cushion', icon: '🛋️', price: 30, description: 'A soft finishing touch.' },
    { id: 'flowers', name: 'Market flowers', icon: '💐', price: 40, description: 'A pop of color for your home.' },
    { id: 'star-rug', name: 'Starry rug', icon: '🌙', price: 65, description: 'A little magic underfoot.' }
  ];
  const sampleRewards = [
    { id: 'coffee', name: 'A little coffee treat', type: 'Coffee & food', icon: '☕', cost: 80 },
    { id: 'wellness', name: 'Wellness class pass', type: 'Health & wellness', icon: '🧘', cost: 120 },
    { id: 'stationery', name: 'Happy pages stationery', type: 'Stationery', icon: '📒', cost: 100 }
  ];
  const initialState = {
    coins: 120,
    view: 'home',
    categories: ['Health & Wellness', 'Home & Lifestyle', 'Personal Growth'],
    completed: {},
    owned: [],
    plans: [
      { id: 'p1', title: 'Take a slow morning walk', date: 'Today', time: '8:30 AM' },
      { id: 'p2', title: 'A little time for myself', date: 'Tomorrow', time: '6:00 PM' }
    ],
    goals: [{ id: 'g1', title: 'Make space for a slower morning', done: false }],
    journal: '',
    transactions: [],
    redemptions: []
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let toastTimer;
  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved ? { ...structuredClone(initialState), ...saved } : structuredClone(initialState);
    } catch (error) {
      return structuredClone(initialState);
    }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { notify('Could not save in this browser. Check storage settings.'); }
    updateHeader();
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function dateKey(date = new Date()) { return date.toISOString().slice(0, 10); }
  function todayEarned() {
    return state.transactions.filter(t => t.date === dateKey() && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  }
  function notify(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  function updateHeader() {
    document.getElementById('coinBalance').textContent = Number(state.coins).toLocaleString('id-ID');
    const date = new Date();
    document.getElementById('todayLabel').textContent = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function navigate(view) {
    state.view = view;
    document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    save();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function isDone(id) { return Boolean(state.completed[`${dateKey()}:${id}`]); }
  function taskRow(task) {
    const done = isDone(task.id);
    return `<div class="task"><button class="check ${done ? 'done' : ''}" data-action="complete-task" data-id="${task.id}" aria-label="${done ? 'Completed' : 'Complete'} ${escapeHtml(task.title)}">${done ? '✓' : ''}</button><div class="task-title">${escapeHtml(task.title)}<small>${escapeHtml(task.detail)}</small></div><span class="reward-tag">${done ? 'Done' : `+${task.reward} coins`}</span></div>`;
  }
  function room() {
    const owned = id => state.owned.includes(id);
    return `<div class="room-scene" aria-label="Illustrated cozy room"><div class="room-window"></div><div class="room-floor"></div><div class="room-rug"></div><div class="room-sofa"></div><div class="room-lamp">${owned('lamp') ? '🏮' : '🪑'}</div><div class="room-plant">${owned('plant') ? '🪴' : '🌿'}</div><div class="room-deco">${owned('art') ? '🖼️' : '💛'}</div><div class="room-avatar">🧸</div></div>`;
  }
  function planRow(plan, index, removable = false) {
    const dateNumber = plan.date === 'Today' ? '12' : plan.date === 'Tomorrow' ? '13' : String(14 + index);
    return `<div class="plan-row"><div class="plan-date"><b>${dateNumber}</b>${escapeHtml(plan.date)}</div><div class="plan-copy"><strong>${escapeHtml(plan.title)}</strong><small>${escapeHtml(plan.time)}</small></div>${removable ? `<button class="btn ghost small" data-action="delete-plan" data-id="${escapeHtml(plan.id)}" aria-label="Remove plan">×</button>` : ''}</div>`;
  }
  function categoryButtons() {
    return categories.map(category => {
      const selected = state.categories.includes(category);
      return `<button class="category ${selected ? 'selected' : ''}" data-action="toggle-category" data-category="${escapeHtml(category)}" aria-pressed="${selected}">${selected ? '✓ ' : ''}${escapeHtml(category)}</button>`;
    }).join('');
  }
  function homeView() {
    const doneCount = tasks.filter(task => isDone(task.id)).length;
    const plans = state.plans.slice(0, 3);
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow">A little space for your life</div><h1>Your life, your way.</h1><p class="subtle">Make a plan, celebrate a small win, or simply take a breath. Your version of a good life is yours to design.</p><button class="btn" data-navigate="life">Explore My Life <span>→</span></button></div></section>
      <div class="grid grid-3"><div class="card stat-card"><span class="stat-icon">🟡</span><div><strong>${Number(state.coins).toLocaleString('id-ID')}</strong><small>LIFE COINS</small></div></div><div class="card stat-card"><span class="stat-icon">🌱</span><div><strong>${doneCount}/${tasks.length}</strong><small>TODAY'S LITTLE WINS</small></div></div><div class="card stat-card"><span class="stat-icon">🏡</span><div><strong>${state.owned.length}</strong><small>ROOM TREASURES</small></div></div></div>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">A gentle nudge</div><h2>Today, at your pace</h2></div><span>☀️</span></div><p class="subtle">Little things count. Pick what feels good today—there’s no perfect streak to keep.</p>${tasks.map(taskRow).join('')}</section>
      <section class="card"><div class="card-head"><div><div class="eyebrow">Your cozy corner</div><h2>My World</h2></div><button class="btn sage small" data-navigate="world">Decorate</button></div>${room()}<div style="margin-top:9px"><span class="chip">☁️ Soft morning</span><span class="chip">${state.owned.length} items collected</span></div></section></div>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">Coming up</div><h2>Your plans</h2></div><button class="btn ghost small" data-navigate="life">Open planner</button></div>${plans.length ? plans.map((plan, index) => planRow(plan, index)).join('') : '<div class="empty">A blank day can be a lovely plan, too.</div>'}</section><section class="card"><div class="eyebrow">Your choices</div><h2>What matters to you</h2><p class="subtle">Your interests can change whenever you do.</p>${state.categories.length ? state.categories.map(category => `<span class="chip">${escapeHtml(category)}</span>`).join('') : '<span class="chip">Still figuring it out</span>'}<div style="margin-top:12px"><button class="btn ghost small" data-navigate="profile">Edit interests</button></div></section></div>`;
  }
  function lifeView() {
    const plans = state.plans.length ? state.plans.map(planRow).join('') : '<div class="empty">No plans yet. Add something small to look forward to.</div>';
    const goals = state.goals.length ? state.goals.map(goal => `<div class="task"><button class="check ${goal.done ? 'done' : ''}" data-action="toggle-goal" data-id="${escapeHtml(goal.id)}" aria-label="Toggle goal">${goal.done ? '✓' : ''}</button><div class="task-title">${escapeHtml(goal.title)}<small>A personal goal, on your terms.</small></div><button class="btn ghost small" data-action="delete-goal" data-id="${escapeHtml(goal.id)}" aria-label="Delete goal">×</button></div>`).join('') : '<div class="empty">No goals yet. Start with a small one that feels right for you.</div>';
    return `<div class="eyebrow">Your practical, personal space</div><h1>My Life</h1><p class="subtle">Make plans that fit your life—not someone else’s checklist.</p>
      <div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">Personal planner</div><h2>Things to look forward to</h2></div><span>🗓️</span></div>${plans}<form id="planForm" class="form-row"><input class="field" name="title" placeholder="Add a plan…" required maxlength="70" aria-label="Plan title"><button class="btn" type="submit">Add</button></form></section>
      <section class="card"><div class="eyebrow">Everyday activities</div><h2>Small steps, your way</h2>${tasks.map(taskRow).join('')}<p class="fine-print">Daily coin earning is capped at ${DAILY_COIN_LIMIT}. Journaling and sensitive personal disclosures never earn coins.</p></section></div>
      <div class="grid grid-2 section"><section class="card"><div class="eyebrow">Custom goals</div><h2>Make it your own</h2>${goals}<form id="goalForm" class="form-row"><input class="field" name="title" placeholder="A goal that matters to you…" required maxlength="90" aria-label="Goal title"><button class="btn" type="submit">Add goal</button></form></section>
      <section class="card"><div class="eyebrow">Private by default</div><h2>A note to yourself</h2><p class="subtle">This reflection stays in this browser in this prototype. It does not earn coins.</p><textarea id="journal" class="field" maxlength="4000" placeholder="What would you like to remember about today?">${escapeHtml(state.journal)}</textarea><div style="margin-top:10px"><button class="btn sage" data-action="save-journal">Save reflection</button></div></section></div>
      <section class="card section"><div class="eyebrow">A flexible life</div><h2>Your focus can change</h2><p class="subtle">Choose the areas you want to make room for right now. You can switch these any time.</p><div class="category-grid">${categoryButtons()}</div></section>`;
  }
  function worldView() {
    return `<div class="eyebrow">A little world that feels like you</div><h1>My World</h1><p class="subtle">Your cozy room is yours to grow—one little treasure at a time.</p><div class="grid grid-2 section"><section class="card"><div class="card-head"><div><div class="eyebrow">Room one</div><h2>A place to exhale</h2></div><span>🏡</span></div>${room()}<div style="margin-top:9px">${state.owned.length ? state.owned.map(id => { const item = decor.find(entry => entry.id === id); return `<span class="chip">${item ? item.icon + ' ' + escapeHtml(item.name) : '✨'}</span>`; }).join('') : '<span class="chip">Your first treasures are waiting</span>'}</div></section><section class="card"><div class="eyebrow">Your collection</div><h2>Decor shop</h2><p class="subtle">Earn coins by showing up for yourself, then make this space your own.</p><div class="notice">🟡 ${Number(state.coins).toLocaleString('id-ID')} LIFE COINS · Virtual decor is just for fun and has no cash value.</div></section></div>
      <section class="section"><div class="card-head"><div><div class="eyebrow">Little things for your home</div><h2>Choose what feels like you</h2></div></div><div class="store-grid">${decor.map(item => { const owned = state.owned.includes(item.id); return `<article class="store-item"><div class="item-art">${item.icon}</div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.description)}</p><button class="btn small ${owned ? 'sage' : ''}" data-action="buy-decor" data-id="${item.id}" ${owned ? 'disabled' : ''}>${owned ? 'In your home' : `🟡 ${item.price} coins`}</button></article>`; }).join('')}</div></section>`;
  }
  function rewardsView() {
    const history = state.transactions.slice(0, 7);
    return `<div class="eyebrow">Small celebrations, thoughtfully earned</div><h1>Rewards</h1><p class="subtle">Explore virtual decor and sample real-world reward ideas. Real offers are not connected in this demo.</p>
      <div class="grid grid-3 section"><div class="card stat-card"><span class="stat-icon">🟡</span><div><strong>${Number(state.coins).toLocaleString('id-ID')}</strong><small>AVAILABLE COINS</small></div></div><div class="card stat-card"><span class="stat-icon">🎁</span><div><strong>${state.redemptions.length}</strong><small>DEMO REDEMPTIONS</small></div></div><div class="card stat-card"><span class="stat-icon">🌱</span><div><strong>${Math.max(0, DAILY_COIN_LIMIT - todayEarned())}</strong><small>COINS AVAILABLE TODAY</small></div></div></div>
      <div class="grid grid-2 section"><section class="card"><div class="eyebrow">Sample voucher ideas</div><h2>A little something nice</h2><p class="subtle">Examples only—no brand partnership or real voucher is active.</p>${sampleRewards.map(reward => { const redeemed = state.redemptions.includes(reward.id); return `<div class="voucher"><span class="voucher-icon">${reward.icon}</span><div class="voucher-copy"><strong>${escapeHtml(reward.name)}</strong><small>${escapeHtml(reward.type)} · Demo reward</small></div><button class="btn small ${redeemed ? 'sage' : ''}" data-action="redeem" data-id="${reward.id}" ${redeemed ? 'disabled' : ''}>${redeemed ? 'Redeemed' : `🟡 ${reward.cost}`}</button></div>`; }).join('')}</section>
      <section class="card"><div class="eyebrow">Your coin story</div><h2>Recent activity</h2>${history.length ? history.map(transaction => `<div class="plan-row"><div class="plan-date"><b>${transaction.amount > 0 ? '+' : '−'}${Math.abs(transaction.amount)}</b>coins</div><div class="plan-copy"><strong>${escapeHtml(transaction.label)}</strong><small>${escapeHtml(transaction.date)}</small></div></div>`).join('') : '<div class="empty">Your coin story starts with your next little win.</div>'}</section></div>
      <p class="fine-print">Real rewards in a production version require server-side validation, clear terms and expiry dates, secure redemption, and separate accounting for brand-funded voucher value and platform revenue.</p>`;
  }
  function profileView() {
    return `<div class="eyebrow">Your space, your settings</div><h1>Profile</h1><p class="subtle">Your choices belong to you. You can change your interests whenever life shifts.</p><div class="grid grid-2 section"><section class="card"><div class="eyebrow">Your life categories</div><h2>What’s on your mind?</h2><p class="subtle">Select any number. There is no required life path.</p><div class="category-grid">${categoryButtons()}</div></section><section class="card"><div class="eyebrow">Privacy & account</div><h2>Your trust matters</h2><div class="notice">🔒 Journals, reflections, and financial details should be private by default.</div><hr class="divider"><p class="subtle">This prototype stores demo data in this browser only. It has no login, cloud backup, or account-deletion service.</p><button class="btn ghost" data-action="reset">Reset demo data</button></section></div><section class="card section"><div class="eyebrow">Your own definition</div><h2>Life, by design</h2><p class="subtle">Plan what matters, collect little wins, and build a world that feels like you. Change course whenever you need.</p><span class="chip">Your life</span><span class="chip">Your choices</span><span class="chip">Your world</span></section>`;
  }
  function render() {
    updateHeader();
    const views = { home: homeView, life: lifeView, world: worldView, rewards: rewardsView, profile: profileView };
    app.innerHTML = (views[state.view] || homeView)();
    document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
  }
  function earnCoins(label, amount) {
    const allowed = Math.max(0, DAILY_COIN_LIMIT - todayEarned());
    const granted = Math.min(amount, allowed);
    if (!granted) { notify('You’ve reached today’s coin limit. Take a gentle break 🌿'); return 0; }
    state.coins += granted;
    state.transactions.unshift({ label, amount: granted, date: dateKey() });
    return granted;
  }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view], [data-navigate]');
    if (nav) { event.preventDefault(); navigate(nav.dataset.view || nav.dataset.navigate); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'complete-task') {
      const key = `${dateKey()}:${id}`;
      if (state.completed[key]) return;
      const task = tasks.find(item => item.id === id);
      state.completed[key] = true;
      const earned = earnCoins(task.title, task.reward);
      save(); render();
      if (earned) notify(`Lovely! +${earned} LIFE COINS`);
    } else if (action === 'toggle-category') {
      const category = button.dataset.category;
      state.categories = state.categories.includes(category) ? state.categories.filter(item => item !== category) : [...state.categories, category];
      save(); render();
    } else if (action === 'buy-decor') {
      const item = decor.find(entry => entry.id === id);
      if (!item || state.owned.includes(id)) return;
      if (state.coins < item.price) { notify('Your next little win can help you save for this 🌱'); return; }
      state.coins -= item.price;
      state.owned.push(id);
      state.transactions.unshift({ label: `Decor: ${item.name}`, amount: -item.price, date: dateKey() });
      save(); render(); notify(`${item.name} is home! 🏡`);
    } else if (action === 'redeem') {
      const reward = sampleRewards.find(entry => entry.id === id);
      if (!reward || state.redemptions.includes(id)) return;
      if (state.coins < reward.cost) { notify('Keep going at your own pace—you’ll get there.'); return; }
      state.coins -= reward.cost;
      state.redemptions.push(id);
      state.transactions.unshift({ label: `Demo redemption: ${reward.name}`, amount: -reward.cost, date: dateKey() });
      save(); render(); notify('Demo redemption recorded. This is not a real voucher.');
    } else if (action === 'delete-plan') {
      state.plans = state.plans.filter(plan => plan.id !== id); save(); render();
    } else if (action === 'save-journal') {
      state.journal = document.getElementById('journal')?.value || '';
      save(); notify('Your reflection is saved in this browser. 💛');
    } else if (action === 'toggle-goal') {
      const goal = state.goals.find(item => item.id === id);
      if (goal) { goal.done = !goal.done; save(); render(); }
    } else if (action === 'delete-goal') {
      state.goals = state.goals.filter(goal => goal.id !== id); save(); render();
    } else if (action === 'reset') {
      if (window.confirm('Reset all LIFE, BY DESIGN demo data saved in this browser?')) {
        localStorage.removeItem(STORAGE_KEY);
        state = structuredClone(initialState);
        save(); render(); notify('A fresh start 🌱');
      }
    }
  });

  document.addEventListener('submit', event => {
    if (event.target.id === 'planForm') {
      event.preventDefault();
      const form = new FormData(event.target);
      const title = String(form.get('title') || '').trim();
      if (!title) return;
      state.plans.push({ id: crypto.randomUUID(), title, date: 'Soon', time: 'Whenever works for you' });
      save(); render(); notify('Plan added. Something to look forward to ✨');
    } else if (event.target.id === 'goalForm') {
      event.preventDefault();
      const form = new FormData(event.target);
      const title = String(form.get('title') || '').trim();
      if (!title) return;
      state.goals.push({ id: crypto.randomUUID(), title, done: false });
      save(); render(); notify('A goal that’s yours. You’ve got this 🌿');
    }
  });

  render();
  save();
})();

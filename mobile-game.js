(() => {
  'use strict';

  const STORAGE_KEY = 'lifeByDesign.v1';
  const POSITIONS_KEY = 'lifeByDesign.mobileRoomPositions';
  const emoji = { plant: '🪴', lamp: '🏮', art: '🖼️', cushion: '🛋️', flowers: '💐', 'star-rug': '🌙' };
  const labels = { plant: 'Sunny little plant', lamp: 'Evening glow lamp', art: 'Little daydream print', cushion: 'Blush cushion', flowers: 'Market flowers', 'star-rug': 'Starry rug' };
  let positions = read(POSITIONS_KEY, {});
  let drag = null;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }
  function savePositions() {
    try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions)); } catch {}
  }
  function isWorldOpen() {
    return document.querySelector('.nav-link.active[data-view="world"]') !== null;
  }
  function setMode() {
    document.body.classList.toggle('mobile-room-active', isWorldOpen());
  }
  function ownedItems() {
    const state = read(STORAGE_KEY, {});
    return Array.isArray(state.owned) ? state.owned.filter(item => emoji[item]) : [];
  }
  function currentCoins() {
    return Number(read(STORAGE_KEY, {}).coins || 0).toLocaleString('id-ID');
  }
  function createOverlay(scene) {
    if (!scene || scene.dataset.mobileGameReady === 'yes') return;
    scene.dataset.mobileGameReady = 'yes';
    scene.classList.add('mobile-room-stage');

    const hud = document.createElement('div');
    hud.className = 'mobile-room-hud';
    hud.innerHTML = `<span class="mobile-room-title">A place to exhale</span><span class="mobile-room-coins">🟡 ${currentCoins()} coins</span>`;
    scene.parentElement.insertBefore(hud, scene);

    const avatar = document.createElement('button');
    avatar.type = 'button';
    avatar.className = 'mobile-avatar';
    avatar.textContent = '🧸';
    avatar.setAttribute('aria-label', 'Your avatar. Tap the room to walk.');
    avatar.style.left = '50%';
    avatar.style.top = '67%';
    scene.appendChild(avatar);

    ownedItems().forEach((itemId, index) => {
      const pos = positions[itemId] || { x: 20 + index * 13, y: 45 + (index % 2) * 12 };
      const furniture = document.createElement('button');
      furniture.type = 'button';
      furniture.className = 'mobile-furniture';
      furniture.textContent = emoji[itemId];
      furniture.dataset.itemId = itemId;
      furniture.setAttribute('aria-label', `${labels[itemId]}; drag to move`);
      furniture.style.left = `${pos.x}%`;
      furniture.style.top = `${pos.y}%`;
      furniture.addEventListener('pointerdown', event => beginDrag(event, furniture, scene));
      scene.appendChild(furniture);
    });

    scene.addEventListener('pointerdown', event => {
      if (event.target.closest('.mobile-furniture, .mobile-avatar, .room-window, .room-sofa, .room-rug, .room-plant, .room-lamp, .room-deco')) return;
      moveAvatar(avatar, scene, event.clientX, event.clientY);
    });
  }
  function beginDrag(event, furniture, scene) {
    event.preventDefault();
    drag = { furniture, scene, id: furniture.dataset.itemId };
    furniture.classList.add('dragging');
    try { furniture.setPointerCapture(event.pointerId); } catch {}
  }
  function percentPoint(scene, x, y) {
    const rect = scene.getBoundingClientRect();
    const snap = (value, step) => Math.round(value / step) * step;
    return {
      x: Math.max(8, Math.min(92, snap(((x - rect.left) / rect.width) * 100, 5))),
      y: Math.max(14, Math.min(87, snap(((y - rect.top) / rect.height) * 100, 5)))
    };
  }
  function moveAvatar(avatar, scene, x, y) {
    const point = percentPoint(scene, x, y);
    avatar.style.left = `${point.x}%`;
    avatar.style.top = `${point.y}%`;
    avatar.classList.remove('walking');
    void avatar.offsetWidth;
    avatar.classList.add('walking');
    window.setTimeout(() => avatar.classList.remove('walking'), 520);
  }
  document.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = percentPoint(drag.scene, event.clientX, event.clientY);
    drag.furniture.style.left = `${point.x}%`;
    drag.furniture.style.top = `${point.y}%`;
    positions[drag.id] = point;
    savePositions();
  });
  document.addEventListener('pointerup', () => {
    if (!drag) return;
    drag.furniture.classList.remove('dragging');
    drag = null;
  });
  document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('mobile-room-active')) return;
    if (event.target.matches('input,textarea,button')) return;
    const step = 5;
    const delta = { ArrowLeft: [-step, 0], a: [-step, 0], ArrowRight: [step, 0], d: [step, 0], ArrowUp: [0, -step], w: [0, -step], ArrowDown: [0, step], s: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    const avatar = document.querySelector('.mobile-avatar');
    const scene = document.querySelector('.mobile-room-stage');
    if (!avatar || !scene) return;
    const x = Math.max(8, Math.min(92, (parseFloat(avatar.style.left) || 50) + delta[0]));
    const y = Math.max(14, Math.min(87, (parseFloat(avatar.style.top) || 67) + delta[1]));
    moveAvatar(avatar, scene, scene.getBoundingClientRect().left + scene.clientWidth * x / 100, scene.getBoundingClientRect().top + scene.clientHeight * y / 100);
  });

  const app = document.getElementById('app');
  const observer = new MutationObserver(() => {
    setMode();
    if (!isWorldOpen()) return;
    const scene = app.querySelector('.room-scene');
    if (scene) createOverlay(scene);
  });
  observer.observe(app, { childList: true, subtree: true });
  observer.observe(document.querySelector('.nav-list'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view], [data-navigate]');
    if (nav) window.setTimeout(() => { setMode(); if (isWorldOpen()) { const scene = app.querySelector('.room-scene'); if (scene) createOverlay(scene); } }, 0);
  });
  setMode();
})();

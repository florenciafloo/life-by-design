(() => {
  'use strict';

  // Small, decorative interactions layered on top of the existing room editor.
  // No planner, coin, or saved room state is modified here.
  let lastFurnitureTap = 0;

  function sparkle(scene, x, y) {
    const star = document.createElement('span');
    star.className = 'room-sparkle';
    star.textContent = ['✦', '✧', '♡'][Math.floor(Math.random() * 3)];
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    scene.appendChild(star);
    star.addEventListener('animationend', () => star.remove(), { once: true });
    window.setTimeout(() => star.remove(), 900);
  }

  function speech(target, message) {
    target.querySelector('.room-speech')?.remove();
    const bubble = document.createElement('span');
    bubble.className = 'room-speech';
    bubble.textContent = message;
    target.appendChild(bubble);
    window.setTimeout(() => bubble.remove(), 1350);
  }

  document.addEventListener('click', event => {
    const furniture = event.target.closest('.room-furniture');
    if (furniture) {
      const now = Date.now();
      // Avoid firing the tap animation at the end of a drag gesture.
      if (now - lastFurnitureTap < 420) return;
      lastFurnitureTap = now;
      furniture.classList.remove('boop');
      void furniture.offsetWidth;
      furniture.classList.add('boop');
      const scene = furniture.closest('.room-scene');
      if (scene) {
        const x = Number.parseFloat(furniture.style.left) || 50;
        const y = Number.parseFloat(furniture.style.top) || 50;
        sparkle(scene, x, y);
      }
      const itemName = furniture.getAttribute('aria-label')?.replace(/^Move /, '') || 'Your decor';
      speech(furniture, `${itemName} looks lovely!`);
      return;
    }

    const avatar = event.target.closest('.avatar-player');
    if (avatar) {
      avatar.classList.remove('wave');
      void avatar.offsetWidth;
      avatar.classList.add('wave');
      const scene = avatar.closest('.room-scene');
      if (scene) {
        const x = Number.parseFloat(avatar.style.left) || 50;
        const y = Number.parseFloat(avatar.style.top) || 60;
        sparkle(scene, x, y - 5);
      }
    }
  });

  document.addEventListener('animationend', event => {
    if (event.target.matches('.room-furniture.boop')) event.target.classList.remove('boop');
    if (event.target.matches('.avatar-player.wave')) event.target.classList.remove('wave');
  });

  // Animate newly purchased or placed pieces when the app renders them.
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const furniture = node.matches?.('.room-furniture') ? node : node.querySelector?.('.room-furniture');
        if (!furniture || furniture.dataset.arrivalSeen) continue;
        furniture.dataset.arrivalSeen = 'true';
        furniture.classList.add('just-placed');
        furniture.addEventListener('animationend', () => furniture.classList.remove('just-placed'), { once: true });
      }
    }
  });
  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
})();

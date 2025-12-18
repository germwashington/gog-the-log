// Lightweight bootloader to ensure the start screen paints reliably.
// We lazy-load `game.js` only when the user actually starts the game (or after idle),
// so parsing/executing the big file can't block first paint.

(() => {
  const GAME_SCRIPT_SRC = 'game.js';
  let gameScriptPromise = null;
  let phase = 'idle'; // idle -> loading -> loaded -> starting

  function loadGameScript() {
    if (window.__tyrianGameLoaded) return Promise.resolve();
    if (gameScriptPromise) return gameScriptPromise;

    gameScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GAME_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        return;
      }

      const s = document.createElement('script');
      s.src = GAME_SCRIPT_SRC;
      s.async = true;
      s.addEventListener('load', () => resolve());
      s.addEventListener('error', (e) => reject(e));
      document.body.appendChild(s);
    })
      .then(() => {
        window.__tyrianGameLoaded = true;
      })
      .catch((err) => {
        console.error('[boot] Failed to load game.js', err);
        throw err;
      });

    return gameScriptPromise;
  }

  async function startGame() {
    const startBtn = document.getElementById('startButton');

    try {
      if (phase === 'idle') {
        phase = 'loading';
        if (startBtn) {
          startBtn.disabled = true;
          startBtn.textContent = 'LOADING...';
        }

        await loadGameScript();

        phase = 'loaded';
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'START GAME';
        }
        return; // 1st click only loads game.js
      }

      if (phase === 'loading') return;

      if (phase === 'loaded') {
        // 2nd click: instantiate the game only (still no RAF loop).
        phase = 'booting';

        if (typeof window.bootGame !== 'function') {
          throw new Error('game.js loaded but window.bootGame() is missing');
        }

        const g = window.bootGame();
        window.__tyrianGameInstance = g;
        phase = 'booted';
        if (startBtn) startBtn.textContent = 'START (RUN)';
        return;
      }

      if (phase === 'booted') {
        // 3rd click: actually start gameplay + loop.
        phase = 'starting';
        const g = window.__tyrianGameInstance || (typeof window.bootGame === 'function' ? window.bootGame() : null);
        if (!g || typeof g.startGame !== 'function') throw new Error('Game instance missing');

        // Yield so the UI can update before any heavier work begins.
        setTimeout(() => {
          try {
            g.startGame();
          } catch (err) {
            console.error('[boot] g.startGame() failed', err);
            alert(`Game failed to start: ${err?.message || err}`);
          } finally {
            phase = 'booted';
          }
        }, 0);
      }
    } catch (e) {
      console.error('[boot] startGame failed', e);
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = 'START GAME';
      }
      phase = 'idle';
      alert(`Game failed to start: ${e?.message || e}`);
    }
  }

  function wireUI() {
    const startBtn = document.getElementById('startButton');
    if (startBtn) startBtn.addEventListener('click', startGame);

    // Space-to-start on the start screen.
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Space') return;
      const startScreen = document.getElementById('startScreen');
      if (!startScreen || startScreen.classList.contains('hidden')) return;
      startGame();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUI, { once: true });
  } else {
    wireUI();
  }
})();



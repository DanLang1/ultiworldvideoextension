(function() {
  const DEFAULTS = { skipSeconds: 5, resumeEnabled: true };
  const SAVE_INTERVAL = 30000;
  const RESUME_EDGE = 5;

  let skipSeconds = DEFAULTS.skipSeconds;
  let resumeEnabled = DEFAULTS.resumeEnabled;
  const resumed = new Set();
  const pending = new Set();
  const hooked = new WeakSet();

  // mux-player nests everything in shadow roots, e.g.
  // <mux-player> # <media-theme> # <media-controller>, and the <video> lives
  // inside <mux-video>'s shadow root. querySelector can't cross those.
  function deepQuery(root, selector) {
    if (!root) return null;
    const direct = root.querySelector(selector);
    if (direct) return direct;

    const queue = [root];
    while (queue.length) {
      for (const el of queue.shift().querySelectorAll('*')) {
        if (!el.shadowRoot) continue;
        const found = el.shadowRoot.querySelector(selector);
        if (found) return found;
        queue.push(el.shadowRoot);
      }
    }
    return null;
  }

  const getPlayer = () => document.querySelector('mux-player');
  const getVideo = () => deepQuery(document, 'video');
  const keyFor = (p) =>
    p.getAttribute('metadata-video-id') ||
    p.getAttribute('playback-id') ||
    `url:${location.pathname}`;

  // Keep the player's on-screen skip buttons in sync with the setting.
  function applySkip() {
    document.querySelectorAll('mux-player').forEach((p) => {
      p.setAttribute('forward-seek-offset', String(skipSeconds));
      p.setAttribute('backward-seek-offset', String(skipSeconds));
    });
  }

  function seek(delta) {
    const video = getVideo();
    if (!video) return;

    const max = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.max(0, Math.min(max, video.currentTime + delta));
  }

  function saveProgress(force) {
    if (!resumeEnabled) return;

    const player = getPlayer();
    const video = getVideo();
    if (!player || !video) return;

    const key = `progress:${keyFor(player)}`;

    if (video.ended) {
      chrome.storage.local.remove(key);
      return;
    }
    if (!Number.isFinite(video.currentTime) || video.currentTime < 1) return;
    if (!force && video.paused) return;

    chrome.storage.local.set({
      [key]: {
        t: video.currentTime,
        d: Number.isFinite(video.duration) ? video.duration : null,
        title: player.getAttribute('metadata-video-title') || document.title,
        url: location.href,
        updated: Date.now()
      }
    });
  }

  function tryResume() {
    if (!resumeEnabled) return;

    const player = getPlayer();
    const video = getVideo();
    if (!player || !video) return;

    if (!hooked.has(video)) {
      hooked.add(video);
      video.addEventListener('seeked', () => saveProgress(true));
      video.addEventListener('ended', () => saveProgress(true));
    }

    const key = keyFor(player);
    if (resumed.has(key) || pending.has(key)) return;
    pending.add(key);

    chrome.storage.local.get(`progress:${key}`, (res) => {
      const entry = res[`progress:${key}`];
      if (!entry || entry.t < RESUME_EDGE) {
        pending.delete(key);
        resumed.add(key);
        return;
      }

      const duration = Number.isFinite(video.duration) ? video.duration : entry.d;
      if (duration && duration - entry.t < RESUME_EDGE) {
        pending.delete(key);
        resumed.add(key);
        return;
      }

      const apply = () => {
        video.currentTime = entry.t;
        pending.delete(key);
        resumed.add(key);
      };

      if (video.readyState >= 1) apply();
      else video.addEventListener('loadedmetadata', apply, { once: true });
    });
  }

  window.addEventListener('keydown', (e) => {
    const forward = e.key === 'ArrowRight';
    const backward = e.key === 'ArrowLeft';
    if (!forward && !backward) return;

    const el = document.activeElement;
    if (el && (
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'BUTTON' ||
      el.isContentEditable
    )) return;

    // Let the player's own seek bar keep its arrow-key behavior.
    if (e.composedPath().some((n) => n.localName === 'media-time-range')) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    seek(forward ? skipSeconds : -skipSeconds);
  }, true);

  chrome.storage.sync.get(DEFAULTS, (items) => {
    skipSeconds = Number(items.skipSeconds) || DEFAULTS.skipSeconds;
    resumeEnabled = items.resumeEnabled !== false;
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.skipSeconds) skipSeconds = Number(changes.skipSeconds.newValue) || DEFAULTS.skipSeconds;
    if (changes.resumeEnabled) resumeEnabled = changes.resumeEnabled.newValue !== false;
  });

  // The player can load late; poll to set up buttons, hooks and resume.
  setInterval(() => {
    applySkip();
    tryResume();
  }, 1000);

  // Persist periodically while playing, plus when the tab goes away.
  setInterval(() => saveProgress(false), SAVE_INTERVAL);
  window.addEventListener('pagehide', () => saveProgress(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveProgress(true);
  });
})();

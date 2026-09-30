const KEY_PREFIX = 'progress:';

function fmtTime(sec) {
  if (!Number.isFinite(sec)) return '--:--';
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function fmtAgo(ts) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const skipInput = document.getElementById('skipInput');
const resumeToggle = document.getElementById('resumeToggle');
const progressList = document.getElementById('progressList');
const clearAll = document.getElementById('clearAll');

chrome.storage.sync.get({ skipSeconds: 5, resumeEnabled: true }, (items) => {
  skipInput.value = items.skipSeconds;
  resumeToggle.checked = items.resumeEnabled !== false;
});

skipInput.addEventListener('change', () => {
  const val = Math.max(1, Math.min(60, Number(skipInput.value) || 5));
  skipInput.value = val;
  chrome.storage.sync.set({ skipSeconds: val });
});

resumeToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ resumeEnabled: resumeToggle.checked });
});

function renderList() {
  chrome.storage.local.get(null, (items) => {
    const entries = Object.entries(items)
      .filter(([key]) => key.startsWith(KEY_PREFIX))
      .sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0));

    progressList.textContent = '';

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nothing saved yet.';
      progressList.appendChild(empty);
      return;
    }

    entries.forEach(([key, entry]) => {
      const item = document.createElement('div');
      item.className = 'item';

      const meta = document.createElement('div');
      meta.className = 'meta';

      const link = document.createElement('a');
      link.href = entry.url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = entry.title || 'Untitled video';
      link.title = entry.title || '';

      const time = document.createElement('div');
      time.className = 'time';
      time.textContent = entry.d
        ? `${fmtTime(entry.t)} / ${fmtTime(entry.d)} - ${fmtAgo(entry.updated)}`
        : `${fmtTime(entry.t)} - ${fmtAgo(entry.updated)}`;

      meta.appendChild(link);
      meta.appendChild(time);

      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '×';
      del.title = 'Remove';
      del.addEventListener('click', () => {
        chrome.storage.local.remove(key, renderList);
      });

      item.appendChild(meta);
      item.appendChild(del);
      progressList.appendChild(item);
    });
  });
}

clearAll.addEventListener('click', () => {
  chrome.storage.local.get(null, (items) => {
    const keys = Object.keys(items).filter((k) => k.startsWith(KEY_PREFIX));
    if (keys.length) chrome.storage.local.remove(keys, renderList);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.keys(changes).some((k) => k.startsWith(KEY_PREFIX))) {
    renderList();
  }
});

renderList();

// main.js — App entry point and event wiring
State.init();

document.addEventListener('DOMContentLoaded', () => {
  UI.updateSessionStats();
  UI.renderHistory();
  UI.updateCounters();

  // Hide key badge if config.js already has a valid key
  const hasConfigKey = (typeof CONFIG !== 'undefined' && CONFIG.GROQ_API_KEY && CONFIG.GROQ_API_KEY !== 'your_groq_api_key_here');
  const savedKey = sessionStorage.getItem('groq_api_key');

  const keyBadge = document.getElementById('keyBadge');
  if (hasConfigKey) {
    // Key is set in config.js — hide the badge entirely
    if (keyBadge) keyBadge.style.display = 'none';
  } else if (savedKey) {
    updateKeyBadge(true);
  }

  // Wire sidebar scam buttons
  document.querySelectorAll('.scam-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scam-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.currentScam = btn.dataset.scam;
      State.currentIcon = btn.dataset.icon;
      const titleEl = document.getElementById('currentScamTitle');
      const iconEl = document.getElementById('currentIcon');
      if (titleEl) titleEl.textContent = btn.dataset.scam;
      if (iconEl) iconEl.textContent = btn.dataset.icon || '';
      const labelEl = document.getElementById('scamTypeLabel');
      if (labelEl) labelEl.textContent = btn.dataset.scam;
    });
  });

  // Medium select changes badge
  const medSel = document.getElementById('mediumSelect');
  if (medSel) medSel.addEventListener('change', () => UI.setBadge(medSel.value));

  if (document.getElementById('headerGenCount'))
    document.getElementById('headerGenCount').textContent = State.totalGenerated;
});

function updateKeyBadge(hasKey) {
  const badge = document.getElementById('keyBadge');
  if (!badge) return;
  badge.textContent = hasKey ? '🔑 Key set' : '🔑 Set API key';
  badge.style.color = hasKey ? 'var(--green)' : 'var(--amber)';
  badge.style.borderColor = hasKey ? 'rgba(62,201,122,0.3)' : 'rgba(232,160,32,0.3)';
  badge.style.background = hasKey ? 'var(--green-dim)' : 'var(--amber-dim)';
}

function openKeyModal() {
  const modal = document.getElementById('keyModal');
  if (modal) {
    modal.style.display = 'flex';
    const inp = document.getElementById('keyInput');
    if (inp) {
      inp.value = sessionStorage.getItem('groq_api_key') || '';
      setTimeout(() => inp.focus(), 50);
    }
  }
}

function closeKeyModal() {
  const modal = document.getElementById('keyModal');
  if (modal) modal.style.display = 'none';
}

function saveApiKey() {
  const inp = document.getElementById('keyInput');
  const key = inp ? inp.value.trim() : '';
  if (!key) { UI.toast('Please enter a valid Groq API key'); return; }
  sessionStorage.setItem('groq_api_key', key);
  updateKeyBadge(true);
  closeKeyModal();
  UI.toast('API key saved ✓');
}

async function generate() {
  const medium = document.getElementById('mediumSelect')?.value || 'phone';
  const intensity = document.getElementById('intensitySelect')?.value || 'medium';
  const target = document.getElementById('targetSelect')?.value || 'general';

  // Check for key first
  if (!API.getKey()) {
    openKeyModal();
    return;
  }

  UI.setGenerating(true);
  UI.setBadge(medium);

  const content = document.getElementById('mockupContent');
  if (content) {
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon" style="opacity:0.5;font-size:32px;animation:spin 1s linear infinite;display:inline-block;">⟳</div>
      <div class="empty-title">Generating realistic mockup...</div>
      <div class="empty-sub">AI is crafting an authentic scam scenario</div>
    </div>`;
  }

  ['redFlagsCard','tacticsCard','profileCard'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  const track = document.getElementById('realismTrack');
  if (track) track.style.display = 'none';

  try {
    const data = await API.generateScam({ scamType: State.currentScam, medium, intensity, target });

    if (content) content.innerHTML = Generator.render(medium, data);

    UI.setSenderBar(data, medium);
    const ts = document.getElementById('mockupTimestamp');
    if (ts) ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stl = document.getElementById('scamTypeLabel');
    if (stl) stl.textContent = State.currentScam;

    State.recordGeneration(State.currentScam, medium, data);
    UI.setStats(data);
    UI.setRedFlags(data.redFlags);
    UI.setTactics(data.tactics);
    UI.setProfile(data.targetProfile);
    UI.updateSessionStats();
    UI.renderHistory();
    UI.updateCounters();

    const fc = document.getElementById('footerCount');
    if (fc) fc.textContent = State.totalGenerated + ' generated this session';

  } catch (err) {
    let msg = err.message || 'Please try again.';
    if (err.message === 'NO_KEY') {
      openKeyModal();
      UI.setGenerating(false);
      return;
    }
    if (content) content.innerHTML = `<div class="empty-state">
      <div class="empty-icon" style="color:var(--red);font-size:28px;">✕</div>
      <div class="empty-title" style="color:var(--red);">Generation failed</div>
      <div class="empty-sub">${msg}</div>
    </div>`;
    UI.toast('Error: ' + msg);
  }

  UI.setGenerating(false);
}

function loadHistory(index) {
  const h = State.history[index];
  if (!h) return;
  const content = document.getElementById('mockupContent');
  if (content) content.innerHTML = Generator.render(h.medium, h.data);
  UI.setBadge(h.medium);
  UI.setSenderBar(h.data, h.medium);
  UI.setStats(h.data);
  UI.setRedFlags(h.data.redFlags);
  UI.setTactics(h.data.tactics);
  UI.setProfile(h.data.targetProfile);
  const stl = document.getElementById('scamTypeLabel');
  if (stl) stl.textContent = h.scamType;
  const ts = document.getElementById('mockupTimestamp');
  if (ts) ts.textContent = h.time;
  State.currentContent = h.data;
  UI.toast('Loaded from history');
  ['copyBtn','saveBtn','regenBtn'].forEach(id => {
    const el = document.getElementById(id); if (el) el.disabled = false;
  });
}

function copyContent() {
  if (!State.currentContent) return;
  navigator.clipboard.writeText(State.currentContent.content || '').then(() => UI.toast('Copied to clipboard ✓'));
}

function saveToLibrary() {
  if (!State.currentContent) return;
  State.addToLibrary({
    scamType: State.currentScam,
    medium: document.getElementById('mediumSelect')?.value || 'phone',
    data: State.currentContent
  });
  UI.toast('Saved to library ✓');
}

function clearHistory() {
  State.history = [];
  State.save();
  UI.renderHistory();
  UI.toast('History cleared');
}

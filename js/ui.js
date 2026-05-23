// ui.js — UI helpers
const UI = {
  toast(msg, duration = 2200) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
  },

  setBadge(medium) {
    const el = document.getElementById('mediumBadge');
    if (!el) return;
    const labels = { phone:'PHONE CALL', sms:'SMS', email:'EMAIL', voicemail:'VOICEMAIL', chat:'CHAT', letter:'LETTER' };
    const classes = { phone:'badge-phone', sms:'badge-sms', email:'badge-email', voicemail:'badge-voicemail', chat:'badge-chat', letter:'badge-letter' };
    el.textContent = labels[medium] || medium.toUpperCase();
    el.className = 'medium-badge ' + (classes[medium] || 'badge-phone');
  },

  setSenderBar(data, medium) {
    const bar = document.getElementById('senderBar');
    const senderLabel = document.getElementById('senderLabel');
    const senderValue = document.getElementById('senderValue');
    const subjectRow = document.getElementById('subjectRow');
    const subjectValue = document.getElementById('subjectValue');
    if (!bar) return;

    if (data.sender) {
      bar.style.display = 'flex';
      const labelMap = { phone:'Caller ID', sms:'Number', email:'From', voicemail:'Caller ID', chat:'Username', letter:'Sender' };
      senderLabel.textContent = labelMap[medium] || 'From';
      senderValue.textContent = data.sender;
    } else {
      bar.style.display = 'none';
    }

    if (data.subject && medium === 'email') {
      subjectRow.style.display = 'flex';
      subjectValue.textContent = data.subject;
    } else {
      subjectRow.style.display = 'none';
    }
  },

  setStats(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('svRealism', (data.realism || '—') + (data.realism ? '%' : ''));
    set('svFlags', data.redFlags ? data.redFlags.length : '—');
    set('svTactics', data.tactics ? data.tactics.length : '—');
    set('svTotal', State.totalGenerated);
    set('statTotal', State.totalGenerated);
    set('headerGenCount', State.totalGenerated);

    const track = document.getElementById('realismTrack');
    if (track) {
      track.style.display = 'block';
      const pct = document.getElementById('rtPct');
      const fill = document.getElementById('rtFill');
      if (pct) pct.textContent = (data.realism || 90) + '%';
      if (fill) setTimeout(() => { fill.style.width = (data.realism || 90) + '%'; }, 80);
    }
  },

  setRedFlags(flags) {
    const card = document.getElementById('redFlagsCard');
    const list = document.getElementById('flagsList');
    const count = document.getElementById('redFlagsCount');
    if (!card || !list) return;
    if (!flags || !flags.length) { card.style.display = 'none'; return; }
    count.textContent = flags.length;
    list.innerHTML = flags.map(f =>
      `<div class="flag-item"><span style="color:var(--red);flex-shrink:0;font-size:10px;">⚑</span><span>${Generator.escHtml(f)}</span></div>`
    ).join('');
    card.style.display = 'block';
  },

  setTactics(tactics) {
    const card = document.getElementById('tacticsCard');
    const list = document.getElementById('tacticsList');
    if (!card || !list) return;
    if (!tactics || !tactics.length) { card.style.display = 'none'; return; }
    list.innerHTML = tactics.map(t => `<span class="tactic-tag">${Generator.escHtml(t)}</span>`).join('');
    card.style.display = 'block';
  },

  setProfile(text) {
    const card = document.getElementById('profileCard');
    const box = document.getElementById('profileBox');
    if (!card || !box) return;
    if (!text) { card.style.display = 'none'; return; }
    box.textContent = text;
    card.style.display = 'block';
  },

  updateSessionStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('ssTotal', State.totalGenerated);
    set('ssAvgRealism', State.getAvgRealism());
    set('ssMostUsed', State.getMostUsed());
    set('headerGenCount', State.totalGenerated);
    set('svTotal', State.totalGenerated);
    if (document.getElementById('statTotal')) document.getElementById('statTotal').textContent = State.totalGenerated;
  },

  renderHistory() {
    const list = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearHistBtn');
    if (!list) return;
    if (!State.history.length) {
      list.innerHTML = '<div class="history-empty">No generations yet</div>';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }
    if (clearBtn) clearBtn.style.display = 'block';
    list.innerHTML = State.history.map((h, i) =>
      `<div class="history-item" onclick="loadHistory(${i})">
        <div class="hi-dot"></div>
        <div class="hi-info">
          <div class="hi-type">${Generator.escHtml(h.scamType)}</div>
          <div class="hi-medium">${h.medium.toUpperCase()}</div>
        </div>
        <span class="hi-time">${h.time}</span>
      </div>`
    ).join('');
  },

  updateCounters() {
    document.querySelectorAll('.scam-item').forEach(btn => {
      const id = btn.dataset.id;
      const scamName = btn.dataset.scam;
      const countEl = btn.querySelector('.si-count');
      if (countEl && scamName) {
        countEl.textContent = State.counters[scamName] || 0;
      }
    });
  },

  setGenerating(yes) {
    const btn = document.getElementById('genBtn');
    const spinner = document.getElementById('genSpinner');
    const btnText = document.getElementById('genBtnText');
    const content = document.getElementById('mockupContent');
    if (!btn) return;
    btn.disabled = yes;
    btn.classList.toggle('loading', yes);
    if (btnText) btnText.textContent = yes ? 'Generating...' : 'Generate';
    if (content) content.classList.toggle('generating', yes);

    const footerBtns = ['copyBtn','saveBtn','regenBtn'];
    footerBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = yes;
    });
  }
};

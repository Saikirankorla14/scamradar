// generator.js — Content generation and rendering
const Generator = {
  suspiciousWords: [
    'immediately','arrest','warrant','lawsuit','suspended','terminate',
    'gift card','wire transfer','cryptocurrency','bitcoin','do not tell',
    'confidential','final notice','last warning','Legal Action','badge number',
    'case number','Social Security','IRS','Internal Revenue','federal agents',
    'local police','24 hours','48 hours','account suspended','unauthorized',
    'verify your identity','click here','call immediately','urgent','WARNING',
    'IMPORTANT','FINAL','overdue','penalty','fine','seized'
  ],

  highlight(text) {
    let out = this.escHtml(text);
    this.suspiciousWords.forEach(w => {
      const re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<span class="phrase-danger">$1</span>');
    });
    return out;
  },

  escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  renderPhone(data) {
    const lines = data.content.split('\n');
    let html = '<div class="rendered-content">';
    lines.forEach(line => {
      if (line.startsWith('[CALLER]') || line.startsWith('[Caller]')) {
        html += `<div class="dialog-line"><div class="dialog-role role-caller">Caller</div><div>${this.highlight(line.replace(/\[CALLER\]:\s*/i,''))}</div></div>`;
      } else if (line.startsWith('[VICTIM]') || line.startsWith('[Victim]') || line.startsWith('[RECIPIENT]')) {
        html += `<div class="dialog-line"><div class="dialog-role role-victim">Recipient</div><div>${this.highlight(line.replace(/\[(VICTIM|RECIPIENT)\]:\s*/i,''))}</div></div>`;
      } else if (line.trim()) {
        html += `<div style="margin-bottom:8px;">${this.highlight(line)}</div>`;
      }
    });
    return html + '</div>';
  },

  renderSMS(data) {
    return `<div class="rendered-content">
      <div class="sms-from">From: ${this.escHtml(data.sender || 'Unknown')}</div>
      <div class="sms-bubble">${this.highlight(data.content)}</div>
    </div>`;
  },

  renderEmail(data) {
    const lines = data.content.split('\n');
    let body = lines.join('<br>');
    return `<div class="rendered-content">${this.highlight(body)}</div>`;
  },

  renderVoicemail(data) {
    return `<div class="rendered-content">
      <div style="font-size:10px;color:var(--text3);margin-bottom:10px;font-family:var(--body);">▶ VOICEMAIL TRANSCRIPT</div>
      <div>${this.highlight(data.content)}</div>
    </div>`;
  },

  renderChat(data) {
    const lines = data.content.split('\n');
    let html = '<div class="rendered-content">';
    lines.forEach(line => {
      if (line.trim()) {
        html += `<div class="sms-bubble" style="margin-bottom:8px;">${this.highlight(line)}</div>`;
      }
    });
    return html + '</div>';
  },

  renderLetter(data) {
    return `<div class="rendered-content" style="font-family:var(--mono);white-space:pre-wrap;">${this.highlight(data.content)}</div>`;
  },

  render(medium, data) {
    const map = {
      phone: () => this.renderPhone(data),
      sms: () => this.renderSMS(data),
      email: () => this.renderEmail(data),
      voicemail: () => this.renderVoicemail(data),
      chat: () => this.renderChat(data),
      letter: () => this.renderLetter(data)
    };
    return (map[medium] || map.phone)();
  }
};

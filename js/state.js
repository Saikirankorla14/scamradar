// state.js — App state management
const State = {
  currentScam: 'IRS / Tax Scam',
  currentIcon: '🏛️',
  currentContent: null,
  totalGenerated: 0,
  history: [],
  library: [],
  counters: {},
  realismSum: 0,

  init() {
    try {
      const saved = sessionStorage.getItem('scamradar_state');
      if (saved) {
        const s = JSON.parse(saved);
        this.totalGenerated = s.totalGenerated || 0;
        this.history = s.history || [];
        this.counters = s.counters || {};
        this.realismSum = s.realismSum || 0;
        this.library = s.library || [];
      }
    } catch(e) {}
  },

  save() {
    try {
      sessionStorage.setItem('scamradar_state', JSON.stringify({
        totalGenerated: this.totalGenerated,
        history: this.history.slice(0, 20),
        counters: this.counters,
        realismSum: this.realismSum,
        library: this.library
      }));
    } catch(e) {}
  },

  recordGeneration(scamType, medium, data) {
    this.totalGenerated++;
    this.realismSum += data.realism || 90;
    this.counters[scamType] = (this.counters[scamType] || 0) + 1;
    this.currentContent = data;

    this.history.unshift({
      id: Date.now(),
      scamType,
      medium,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      data
    });
    if (this.history.length > 20) this.history.pop();
    this.save();
  },

  addToLibrary(item) {
    this.library.unshift({ ...item, savedAt: new Date().toISOString() });
    this.save();
  },

  getMostUsed() {
    if (!Object.keys(this.counters).length) return '—';
    return Object.entries(this.counters).sort((a, b) => b[1] - a[1])[0][0].split('/')[0].trim();
  },

  getAvgRealism() {
    if (!this.totalGenerated) return '—';
    return Math.round(this.realismSum / this.totalGenerated) + '%';
  }
};

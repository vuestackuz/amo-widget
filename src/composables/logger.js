const logger = {
  enabled: true, // master switch
  levels: { log: false, warn: true, error: true }, // per-type switches

  _time() {
    return new Date().toLocaleTimeString()
  },

  _print(fn, type, msg) {
    if (!this.enabled || !this.levels[type]) return
    fn(`${this._time()} - ${msg}`)
  },

  log(msg) {
    this._print(console.log, 'log', msg)
  },

  warn(msg) {
    this._print(console.warn, 'warn', msg)
  },

  error(msg) {
    this._print(console.error, 'error', msg)
  },

  // Helpers to toggle levels
  enableAll() { this.enabled = true; for (let k in this.levels) this.levels[k] = true },
  disableAll() { this.enabled = false },
  enable(type) { if (this.levels[type] !== undefined) this.levels[type] = true },
  disable(type) { if (this.levels[type] !== undefined) this.levels[type] = false }
}

export default logger
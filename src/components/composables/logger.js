const logger = {
  info: (...args) => console.info('[Utel]', ...args),
  warn: (...args) => console.warn('[Utel]', ...args),
  error: (...args) => console.error('[Utel]', ...args),
};

export default logger;

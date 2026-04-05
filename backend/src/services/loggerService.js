const formatLog = (level, event, payload = {}) =>
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload
  });

export const logger = {
  info(event, payload) {
    console.log(formatLog('info', event, payload));
  },
  warn(event, payload) {
    console.warn(formatLog('warn', event, payload));
  },
  error(event, payload) {
    console.error(formatLog('error', event, payload));
  }
};

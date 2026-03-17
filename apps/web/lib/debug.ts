const isDebug = () =>
  process.env.NEXT_PUBLIC_DEBUG === 'ON' || process.env.DEBUG === 'ON';

export const debug = {
  log: (...args: unknown[]) => { if (isDebug()) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDebug()) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDebug()) console.error(...args); },
};

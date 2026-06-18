export function normalizeOptions(opts: any): string[] {
  if (Array.isArray(opts)) return opts;
  if (opts && typeof opts === 'object') {
    if (Array.isArray((opts as any).items)) return (opts as any).items;
    const keys = Object.keys(opts).filter((k) => String(Number(k)) === k);
    if (keys.length > 0) {
      return keys.sort((a, b) => Number(a) - Number(b)).map((k) => opts[k]);
    }
  }
  if (typeof opts === 'string') {
    try {
      const parsed = JSON.parse(opts);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) return parsed.items;
    } catch {
      // ignore
    }
  }
  return [];
}

export default normalizeOptions;

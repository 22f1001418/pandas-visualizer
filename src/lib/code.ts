/**
 * Code listings for lesson pages.
 *
 * Steps need to highlight the line they are executing. Hand-counting line
 * numbers is fragile — editing the listing silently shifts every number below
 * the edit — so steps name a fragment of the line instead and we look it up.
 */
export interface Listing {
  /** The source, as handed to <CodeCell />. */
  code: string;
  /** Line numbers (0-based) of the lines containing each fragment. */
  at: (...fragments: string[]) => number[];
  /** Every line from the one containing `from` to the one containing `to`. */
  range: (from: string, to: string) => number[];
}

export function listing(code: string): Listing {
  const lines = code.split("\n");

  const find = (fragment: string): number => {
    const i = lines.findIndex((l) => l.includes(fragment));
    if (i < 0 && import.meta.env.DEV) {
      // A miss just means no highlight, but it is always an authoring slip.
      console.warn(`[listing] no line contains: ${fragment}`);
    }
    return i;
  };

  return {
    code,
    at: (...fragments) => fragments.map(find).filter((i) => i >= 0),
    range: (from, to) => {
      const a = find(from);
      const b = find(to);
      if (a < 0 || b < 0) return [];
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      return Array.from({ length: hi - lo + 1 }, (_, k) => lo + k);
    },
  };
}

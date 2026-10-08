import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getIcon } from "@/lib/icons";
import { PAGES, PAGE_ORDER, sectionOf } from "@/pages/registry";
import { useStore } from "@/store/useStore";

/** Rank a lesson against the query: title hits beat keyword hits. */
function score(id: (typeof PAGE_ORDER)[number], q: string): number {
  if (!q) return 1;
  const m = PAGES[id];
  const hay = `${m.title} ${m.short ?? ""} ${m.blurb} ${m.keywords ?? ""} ${(m.api ?? []).join(" ")}`;
  const needle = q.toLowerCase();
  const title = `${m.title} ${m.short ?? ""}`.toLowerCase();
  if (title.startsWith(needle)) return 100;
  if (title.includes(needle)) return 60;
  // Match each whitespace-separated term against the keywords and API list.
  // A subsequence ("fuzzy") fallback was tried and removed: over a haystack
  // this long it matched almost every lesson, which buried the real hits.
  const low = hay.toLowerCase();
  if (low.includes(needle)) return 20;
  const terms = needle.split(/\s+/).filter(Boolean);
  if (terms.length > 1 && terms.every((t) => low.includes(t))) return 10;
  return 0;
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setPalette = useStore((s) => s.setPalette);
  const setPage = useStore((s) => s.setPage);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const Search = getIcon("Search");

  const results = useMemo(() => {
    return PAGE_ORDER.map((id) => ({ id, s: score(id, q.trim()) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || PAGE_ORDER.indexOf(a.id) - PAGE_ORDER.indexOf(b.id))
      .map((r) => r.id);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      // Focus after the entry animation has mounted the input.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [q]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[cursor];
      if (pick) setPage(pick);
    } else if (e.key === "Escape") {
      setPalette(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="palette__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPalette(false)}
      >
        <motion.div
          className="palette"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Search lessons"
        >
          <div className="palette__search">
            <Search size={15} className="text-fg-subtle shrink-0" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search lessons, methods, concepts…"
              className="palette__input"
              aria-label="Search lessons"
            />
            <kbd className="kbd">esc</kbd>
          </div>

          <div className="palette__list">
            {results.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-fg-muted">
                Nothing matched “{q}”.
              </p>
            )}
            {results.map((id, i) => {
              const meta = PAGES[id];
              const Icon = getIcon(meta.icon);
              return (
                <button
                  key={id}
                  className={`palette__row ${i === cursor ? "palette__row--on" : ""}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => setPage(id)}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex flex-col items-start min-w-0">
                    <span className="text-[13px] font-medium truncate">
                      {meta.title}
                    </span>
                    <span className="text-[11.5px] text-fg-subtle truncate">
                      {meta.blurb}
                    </span>
                  </span>
                  <span className="ml-auto chip shrink-0">{sectionOf(id)}</span>
                </button>
              );
            })}
          </div>

          <div className="palette__foot">
            <span>
              <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move
            </span>
            <span>
              <kbd className="kbd">↵</kbd> to open
            </span>
            <span className="ml-auto">{results.length} lessons</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

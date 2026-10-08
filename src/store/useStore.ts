import { create } from "zustand";
import { LESSON_IDS, type PageId } from "@/pages/registry";

export type { PageId };

export type Theme = "dark" | "light";

const THEME_KEY = "pandas-viz-theme";

interface StoreState {
  page: PageId;
  theme: Theme;
  sidebarOpen: boolean;
  paletteOpen: boolean;
  /** Milliseconds per step during playback. */
  speed: number;
  setPage: (p: PageId) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setPalette: (open: boolean) => void;
  setSpeed: (ms: number) => void;
}

const isPageId = (v: string): v is PageId =>
  (LESSON_IDS as readonly string[]).includes(v);

/** Read the lesson id out of the URL hash (`#/groupby`). */
const pageFromHash = (): PageId => {
  if (typeof window === "undefined") return "overview";
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  return isPageId(raw) ? raw : "overview";
};

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

const applyTheme = (t: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(t);
  // Also set the attribute the published-page theme guards look for.
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // Private windows and blocked site data: the theme just will not persist.
  }
};

const startOnDesktop = () =>
  typeof window === "undefined" ? true : window.innerWidth >= 1024;

export const useStore = create<StoreState>((set, get) => ({
  page: pageFromHash(),
  theme: getInitialTheme(),
  sidebarOpen: startOnDesktop(),
  paletteOpen: false,
  speed: 1400,

  setPage: (p) => {
    if (typeof window !== "undefined" && pageFromHash() !== p) {
      window.location.hash = `#/${p}`;
    }
    // Deep-linking into a lesson should land you at its top.
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    set({ page: p, paletteOpen: false });
    if (!startOnDesktop()) set({ sidebarOpen: false });
  },

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setPalette: (open) => set({ paletteOpen: open }),
  setSpeed: (ms) => set({ speed: ms }),
}));

// Apply theme + follow browser navigation (back/forward, pasted links).
if (typeof document !== "undefined") {
  applyTheme(getInitialTheme());
  window.addEventListener("hashchange", () => {
    const p = pageFromHash();
    if (useStore.getState().page !== p) useStore.setState({ page: p });
  });
}

import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { PAGES, type PageId } from "@/pages/registry";
import { useStore } from "@/store/useStore";

/**
 * Lessons are code-split: the initial load only carries the shell plus the
 * lesson you asked for, which keeps the first paint quick even though the
 * app ships 27 of them.
 */
const LESSON_COMPONENTS: Record<PageId, ComponentType> = {
  overview: lazy(() => import("@/pages/OverviewPage").then((m) => ({ default: m.OverviewPage }))),
  create: lazy(() => import("@/pages/CreatePage").then((m) => ({ default: m.CreatePage }))),
  inspect: lazy(() => import("@/pages/InspectPage").then((m) => ({ default: m.InspectPage }))),
  series: lazy(() => import("@/pages/SeriesPage").then((m) => ({ default: m.SeriesPage }))),
  dtypes: lazy(() => import("@/pages/DtypesPage").then((m) => ({ default: m.DtypesPage }))),
  selection: lazy(() => import("@/pages/SelectionPage").then((m) => ({ default: m.SelectionPage }))),
  filtering: lazy(() => import("@/pages/FilteringPage").then((m) => ({ default: m.FilteringPage }))),
  query: lazy(() => import("@/pages/QueryPage").then((m) => ({ default: m.QueryPage }))),
  indexing: lazy(() => import("@/pages/IndexingPage").then((m) => ({ default: m.IndexingPage }))),
  copyview: lazy(() => import("@/pages/CopyViewPage").then((m) => ({ default: m.CopyViewPage }))),
  missing: lazy(() => import("@/pages/MissingPage").then((m) => ({ default: m.MissingPage }))),
  duplicates: lazy(() => import("@/pages/DuplicatesPage").then((m) => ({ default: m.DuplicatesPage }))),
  strings: lazy(() => import("@/pages/StringsPage").then((m) => ({ default: m.StringsPage }))),
  datetime: lazy(() => import("@/pages/DatetimePage").then((m) => ({ default: m.DatetimePage }))),
  columns: lazy(() => import("@/pages/ColumnsPage").then((m) => ({ default: m.ColumnsPage }))),
  apply: lazy(() => import("@/pages/ApplyPage").then((m) => ({ default: m.ApplyPage }))),
  sorting: lazy(() => import("@/pages/SortingPage").then((m) => ({ default: m.SortingPage }))),
  window: lazy(() => import("@/pages/WindowPage").then((m) => ({ default: m.WindowPage }))),
  groupby: lazy(() => import("@/pages/GroupByPage").then((m) => ({ default: m.GroupByPage }))),
  aggregate: lazy(() => import("@/pages/AggregatePage").then((m) => ({ default: m.AggregatePage }))),
  valuecounts: lazy(() => import("@/pages/ValueCountsPage").then((m) => ({ default: m.ValueCountsPage }))),
  merge: lazy(() => import("@/pages/MergePage").then((m) => ({ default: m.MergePage }))),
  concat: lazy(() => import("@/pages/ConcatPage").then((m) => ({ default: m.ConcatPage }))),
  pivot: lazy(() => import("@/pages/PivotPage").then((m) => ({ default: m.PivotPage }))),
  stack: lazy(() => import("@/pages/StackPage").then((m) => ({ default: m.StackPage }))),
  cheatsheet: lazy(() => import("@/pages/CheatsheetPage").then((m) => ({ default: m.CheatsheetPage }))),
  pitfalls: lazy(() => import("@/pages/PitfallsPage").then((m) => ({ default: m.PitfallsPage }))),
};

export default function App() {
  const page = useStore((s) => s.page);
  const setPalette = useStore((s) => s.setPalette);
  const toggleTheme = useStore((s) => s.toggleTheme);

  // Keep the document title in step with the lesson, so browser history and
  // bookmarks read usefully.
  useEffect(() => {
    document.title = `${PAGES[page].title} · Pandas Visualizer by KM`;
  }, [page]);

  // Global shortcuts. Per-step keys (← → space) live in <StepRunner />.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) ||
        el?.isContentEditable;

      // ⌘K works from anywhere, including from inside a field.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
        return;
      }

      // Bare-letter shortcuts must never fire while the user is typing — and
      // the palette counts as typing even before its input takes focus,
      // otherwise searching for "pivot" toggles the theme on the "t".
      if (typing || useStore.getState().paletteOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        setPalette(true);
      } else if (e.key.toLowerCase() === "t") {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPalette, toggleTheme]);

  const Lesson = LESSON_COMPONENTS[page];

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LessonSkeleton />}>
            <Lesson />
          </Suspense>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="page">
      <div className="skeleton h-9 w-2/5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="skeleton h-72" />
    </div>
  );
}

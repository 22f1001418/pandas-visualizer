import { getIcon } from "@/lib/icons";
import { PAGES, neighbours, sectionOf } from "@/pages/registry";
import { useStore } from "@/store/useStore";
import type { PageId } from "@/pages/registry";

/** Previous / next lesson footer, so the app reads as a course. */
export function LessonNav({ id }: { id: PageId }) {
  const setPage = useStore((s) => s.setPage);
  const { prev, next } = neighbours(id);
  const Left = getIcon("ArrowRight");
  const Right = getIcon("ArrowRight");

  return (
    <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {prev ? (
        <button className="lesson-nav" onClick={() => setPage(prev)}>
          <Left size={14} className="rotate-180 shrink-0 text-fg-subtle" />
          <span className="flex flex-col items-start min-w-0">
            <span className="lesson-nav__kicker">
              Previous · {sectionOf(prev)}
            </span>
            <span className="lesson-nav__title">{PAGES[prev].title}</span>
          </span>
        </button>
      ) : (
        <div />
      )}

      {next && (
        <button
          className="lesson-nav sm:justify-end sm:text-right"
          onClick={() => setPage(next)}
        >
          <span className="flex flex-col sm:items-end items-start min-w-0 order-1 sm:order-none">
            <span className="lesson-nav__kicker">Next · {sectionOf(next)}</span>
            <span className="lesson-nav__title">{PAGES[next].title}</span>
          </span>
          <Right size={14} className="shrink-0 text-fg-subtle order-2" />
        </button>
      )}
    </nav>
  );
}

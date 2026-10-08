import { useMemo, useState } from "react";
import { getIcon } from "@/lib/icons";
import { PAGES, PAGE_ORDER, PAGE_SECTIONS } from "@/pages/registry";
import { useStore } from "@/store/useStore";

export function Sidebar() {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const open = useStore((s) => s.sidebarOpen);
  const setSidebar = useStore((s) => s.setSidebar);
  const [filter, setFilter] = useState("");
  const Search = getIcon("Search");

  const q = filter.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return new Set(
      PAGE_ORDER.filter((id) => {
        const m = PAGES[id];
        return `${m.title} ${m.short ?? ""} ${m.keywords ?? ""} ${(m.api ?? []).join(" ")}`
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [q]);

  const lessonCount = PAGE_ORDER.length - 2; // the two reference pages

  return (
    <>
      {/* Scrim: on small screens the sidebar floats over the content. */}
      {open && (
        <div
          className="sidebar__scrim lg:hidden"
          onClick={() => setSidebar(false)}
          aria-hidden
        />
      )}

      <aside
        className={`sidebar ${open ? "sidebar--open" : "sidebar--closed"}`}
        aria-label="Lessons"
      >
        <div className="flex flex-col h-full w-[268px]">
          <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
            <div className="brand__mark">pd</div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[13.5px] font-semibold text-fg truncate">
                Pandas Visualizer
              </span>
              <span className="text-[11px] text-fg-subtle">by KM</span>
            </div>
          </div>

          <div className="px-3 pb-2">
            <div className="sidebar__search">
              <Search size={13} className="text-fg-subtle shrink-0" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter lessons…"
                aria-label="Filter lessons"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-4">
            {PAGE_SECTIONS.map((section) => {
              const pages = section.pages.filter(
                (id) => !matches || matches.has(id),
              );
              if (!pages.length) return null;
              return (
                <div key={section.label} className="flex flex-col">
                  <div className="sb-section">{section.label}</div>
                  {pages.map((id) => {
                    const meta = PAGES[id];
                    const Icon = getIcon(meta.icon);
                    const active = id === page;
                    return (
                      <button
                        key={id}
                        className={`sb-link ${active ? "sb-link--active" : ""}`}
                        onClick={() => setPage(id)}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon size={15} className="shrink-0" />
                        <span className="truncate">
                          {meta.short ?? meta.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {matches?.size === 0 && (
              <p className="px-3 py-4 text-[12px] text-fg-muted">
                No lesson matches “{filter}”.
              </p>
            )}
          </nav>

          <div className="px-4 py-3 border-t border-border flex flex-col gap-1">
            <span className="text-[11px] text-fg-muted">
              {lessonCount} lessons · 2 reference pages
            </span>
            <span className="text-[11px] text-fg-subtle">
              Built for students · by KM
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

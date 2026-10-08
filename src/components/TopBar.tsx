import { getIcon } from "@/lib/icons";
import { PAGES, PAGE_ORDER, sectionOf } from "@/pages/registry";
import { useStore } from "@/store/useStore";

export function TopBar() {
  const page = useStore((s) => s.page);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setPalette = useStore((s) => s.setPalette);

  const meta = PAGES[page];
  const Menu = getIcon("Menu");
  const Sun = getIcon("Sun");
  const Moon = getIcon("Moon");
  const Link = getIcon("ExternalLink");
  const Search = getIcon("Search");

  const position = PAGE_ORDER.indexOf(page) + 1;

  return (
    <header className="topbar">
      <button
        className="btn btn-ghost"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      <div className="flex items-center gap-2 text-[13px] min-w-0">
        <span className="chip chip-pink hidden sm:inline-flex">
          {sectionOf(page)}
        </span>
        <span className="text-fg-subtle hidden sm:inline">/</span>
        <span className="truncate text-fg font-medium">{meta.title}</span>
        <span className="text-[11px] font-mono text-fg-subtle shrink-0">
          {position}/{PAGE_ORDER.length}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          className="btn btn-ghost topbar__search"
          onClick={() => setPalette(true)}
          title="Search lessons"
        >
          <Search size={14} />
          <span className="hidden md:inline">Search</span>
          <kbd className="kbd hidden md:inline">⌘K</kbd>
        </button>

        {meta.docs && (
          <a
            className="btn btn-ghost hidden lg:inline-flex"
            href={meta.docs}
            target="_blank"
            rel="noreferrer noopener"
            title="Open the official pandas docs for this topic"
          >
            <Link size={14} /> Docs
          </a>
        )}

        <button
          className="btn btn-ghost"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}

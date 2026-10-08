import { Callout } from "@/components/Callout";
import { PageShell } from "@/components/PageShell";
import { getIcon } from "@/lib/icons";
import { PAGES, PAGE_ORDER, sectionOf } from "./registry";
import { useStore } from "@/store/useStore";

/**
 * Assembled from every lesson's own `gotcha`, so this page cannot drift out of
 * step with the lessons it summarises.
 */
export function PitfallsPage() {
  const setPage = useStore((s) => s.setPage);
  const Arrow = getIcon("ArrowRight");

  const pitfalls = PAGE_ORDER.filter((id) => PAGES[id].gotcha);

  return (
    <PageShell meta={PAGES.pitfalls}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="chip chip-pink">{pitfalls.length} traps</span>
        <span className="text-[12.5px] text-fg-muted">
          Each one is drawn from the lesson it belongs to — follow the link to
          see it happen step by step.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        {pitfalls.map((id, i) => {
          const meta = PAGES[id];
          return (
            <div key={id} className="flex flex-col gap-1.5">
              <Callout
                tone={i % 3 === 0 ? "warning" : i % 3 === 1 ? "danger" : "pink"}
                label={`${i + 1} · ${meta.short ?? meta.title}`}
              >
                {meta.gotcha}
              </Callout>
              <button
                className="self-start chip chip-accent ml-1"
                onClick={() => setPage(id)}
                title={`Open the ${meta.title} lesson`}
              >
                {sectionOf(id)} · {meta.short ?? meta.title}
                <Arrow size={11} />
              </button>
            </div>
          );
        })}
      </div>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="section-title">A short debugging checklist</h2>
        <ol className="flex flex-col gap-2 text-[13.5px] leading-relaxed text-fg list-decimal pl-5">
          <li>
            <strong>Check the dtypes first.</strong> Roughly half of all
            “pandas gave me the wrong answer” bugs are a numeric column sitting
            in <code className="api-chip">object</code> dtype.
          </li>
          <li>
            <strong>Print the shape before and after.</strong> Every merge,
            filter and groupby changes the row count — and a surprising count is
            the earliest signal that something is wrong.
          </li>
          <li>
            <strong>Count the missing values.</strong>{" "}
            <code className="api-chip">df.isna().sum()</code> explains most
            unexpected NaN in a result, and most quietly dropped rows.
          </li>
          <li>
            <strong>Read the warnings.</strong> SettingWithCopyWarning and the
            dtype-promotion warnings are telling you the code did not do what
            you wrote.
          </li>
          <li>
            <strong>Did you reassign?</strong> Nearly every method returns a new
            object. <code className="api-chip">df.sort_values("x")</code> on its
            own line changes nothing at all.
          </li>
        </ol>
      </section>
    </PageShell>
  );
}

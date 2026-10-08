import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { PAGES, type PageId } from "./registry";
import { getIcon } from "@/lib/icons";
import { useStore } from "@/store/useStore";

interface Entry {
  code: string;
  what: string;
  lesson: PageId;
}

const SHEET: Array<{ title: string; entries: Entry[] }> = [
  {
    title: "Load & look",
    entries: [
      { code: 'pd.read_csv("f.csv")', what: "Read a CSV, inferring columns and dtypes", lesson: "create" },
      { code: 'pd.read_csv("f.csv", parse_dates=["ts"])', what: "Parse date columns while reading", lesson: "datetime" },
      { code: 'pd.DataFrame({"a": [1, 2]})', what: "Build from a dict of columns", lesson: "create" },
      { code: 'df.to_csv("out.csv", index=False)', what: "Write out without the index column", lesson: "create" },
      { code: "df.head(5) · df.tail(5)", what: "First or last rows", lesson: "inspect" },
      { code: "df.shape · len(df)", what: "(rows, columns) · row count", lesson: "inspect" },
      { code: "df.info()", what: "Dtypes, non-null counts, memory", lesson: "inspect" },
      { code: "df.describe()", what: "Summary statistics for numeric columns", lesson: "inspect" },
      { code: "df.sample(5, random_state=0)", what: "Random rows, reproducibly", lesson: "inspect" },
      { code: "df.nunique()", what: "Distinct values per column", lesson: "inspect" },
    ],
  },
  {
    title: "Select",
    entries: [
      { code: 'df["col"]', what: "One column, as a Series", lesson: "overview" },
      { code: 'df[["a", "b"]]', what: "Several columns, as a DataFrame", lesson: "overview" },
      { code: "df.loc[label]", what: "Row by index label", lesson: "selection" },
      { code: "df.loc[1:3]", what: "Label slice — inclusive of 3", lesson: "selection" },
      { code: "df.iloc[1:3]", what: "Position slice — excludes 3", lesson: "selection" },
      { code: 'df.loc[mask, ["a", "b"]]', what: "Rows by condition, columns by name", lesson: "selection" },
      { code: 'df.at[1, "col"]', what: "Single cell, fastest path", lesson: "selection" },
    ],
  },
  {
    title: "Filter",
    entries: [
      { code: 'df[df["score"] > 80]', what: "Boolean mask", lesson: "filtering" },
      { code: "df[(a > 1) & (b < 2)]", what: "AND — parentheses required", lesson: "filtering" },
      { code: "df[(a > 1) | (b < 2)]", what: "OR", lesson: "filtering" },
      { code: "df[~mask]", what: "NOT", lesson: "filtering" },
      { code: 'df[df["c"].isin(["x", "y"])]', what: "Membership in a list", lesson: "query" },
      { code: 'df[df["n"].between(1, 10)]', what: "Inclusive numeric range", lesson: "query" },
      { code: 'df.query("score > 85 and batch == \'DSML\'")', what: "Filter as a string expression", lesson: "query" },
      { code: 'df.query("score > @cutoff")', what: "Reference a Python variable", lesson: "query" },
    ],
  },
  {
    title: "Clean",
    entries: [
      { code: "df.isna().sum()", what: "Missing values per column", lesson: "missing" },
      { code: 'df[df["col"].isna()]', what: "Rows where a value is missing", lesson: "missing" },
      { code: "df.fillna(0)", what: "Fill every gap with a constant", lesson: "missing" },
      { code: 'df.fillna({"a": df["a"].mean()})', what: "Fill per column", lesson: "missing" },
      { code: "df.ffill()", what: "Carry the last valid value forward", lesson: "missing" },
      { code: 'df.dropna(subset=["score"])', what: "Drop rows missing a specific column", lesson: "missing" },
      { code: "df.duplicated().sum()", what: "Count repeated rows", lesson: "duplicates" },
      { code: 'df.drop_duplicates(subset=["id"], keep="last")', what: "One row per id, newest kept", lesson: "duplicates" },
      { code: 'pd.to_numeric(s, errors="coerce")', what: "Text → numbers, bad values to NaN", lesson: "dtypes" },
      { code: 'df["c"].astype("category")', what: "Compress repeated text", lesson: "dtypes" },
    ],
  },
  {
    title: "Transform",
    entries: [
      { code: 'df["new"] = df["a"] / df["b"]', what: "Derived column, vectorised", lesson: "columns" },
      { code: "df.assign(new=...)", what: "Add a column inside a chain", lesson: "columns" },
      { code: 'df.drop(columns=["a"])', what: "Remove columns", lesson: "columns" },
      { code: 'df.rename(columns={"a": "b"})', what: "Relabel columns", lesson: "columns" },
      { code: "s.apply(lambda v: ...)", what: "Custom function per value", lesson: "apply" },
      { code: 's.map({"a": 1, "b": 2})', what: "Recode with a dict", lesson: "apply" },
      { code: "df.apply(fn, axis=1)", what: "Custom function per row (slow)", lesson: "apply" },
      { code: 'np.where(cond, "x", "y")', what: "Vectorised if/else", lesson: "apply" },
      { code: "pd.cut(s, bins=[0, 50, 100])", what: "Bucket a numeric column", lesson: "apply" },
    ],
  },
  {
    title: "Order & window",
    entries: [
      { code: 'df.sort_values("score", ascending=False)', what: "Sort by a column", lesson: "sorting" },
      { code: 'df.sort_values(["a", "b"], ascending=[True, False])', what: "Multi-column, mixed directions", lesson: "sorting" },
      { code: "df.sort_index()", what: "Sort by index label", lesson: "indexing" },
      { code: 's["x"].rank(ascending=False)', what: "Ordering as a number", lesson: "sorting" },
      { code: 'df.nlargest(3, "score")', what: "Top n without a full sort", lesson: "sorting" },
      { code: "s.shift(1)", what: "Previous row's value", lesson: "window" },
      { code: "s.diff() · s.pct_change()", what: "Absolute · relative change", lesson: "window" },
      { code: "s.cumsum()", what: "Running total", lesson: "window" },
      { code: "s.rolling(3).mean()", what: "Moving average", lesson: "window" },
      { code: 'df.groupby("g")["x"].shift(1)', what: "Window that restarts per group", lesson: "window" },
    ],
  },
  {
    title: "Aggregate",
    entries: [
      { code: 'df.groupby("g")["x"].mean()', what: "One aggregate per group", lesson: "groupby" },
      { code: 'df.groupby("g", as_index=False)', what: "Keep the key as a column", lesson: "groupby" },
      { code: 'df.groupby("g").size()', what: "Rows per group", lesson: "groupby" },
      { code: 'g.agg(avg=("x", "mean"), n=("x", "count"))', what: "Several named metrics", lesson: "aggregate" },
      { code: 'g["x"].transform("mean")', what: "Group value on every row", lesson: "aggregate" },
      { code: "g.filter(lambda d: len(d) > 2)", what: "Keep or drop whole groups", lesson: "aggregate" },
      { code: 's.value_counts()', what: "Frequency per distinct value", lesson: "valuecounts" },
      { code: "s.value_counts(normalize=True)", what: "Shares instead of counts", lesson: "valuecounts" },
      { code: "pd.crosstab(a, b)", what: "Two-way frequency table", lesson: "valuecounts" },
    ],
  },
  {
    title: "Combine & reshape",
    entries: [
      { code: 'pd.merge(a, b, on="id", how="left")', what: "Join on a shared key", lesson: "merge" },
      { code: "pd.merge(a, b, on='id', indicator=True)", what: "Add a _merge provenance column", lesson: "merge" },
      { code: 'pd.merge(a, b, validate="one_to_one")', what: "Raise if the keys are not unique", lesson: "merge" },
      { code: "pd.concat([a, b], ignore_index=True)", what: "Stack rows and renumber", lesson: "concat" },
      { code: "pd.concat([a, b], axis=1)", what: "Side by side, aligned on index", lesson: "concat" },
      { code: 'df.pivot(index="r", columns="c", values="v")', what: "Long → wide", lesson: "pivot" },
      { code: 'df.pivot_table(..., aggfunc="sum", margins=True)', what: "Wide with aggregation and totals", lesson: "pivot" },
      { code: 'df.melt(id_vars=["r"])', what: "Wide → long", lesson: "pivot" },
      { code: "g.unstack() · df.stack()", what: "Move a level between axes", lesson: "stack" },
      { code: 'df.xs("Jan", level="month")', what: "Cross-section of a MultiIndex", lesson: "stack" },
      { code: "df.reset_index()", what: "Flatten the index into columns", lesson: "indexing" },
    ],
  },
  {
    title: "Write safely",
    entries: [
      { code: 'df.loc[mask, "col"] = value', what: "The only reliable conditional write", lesson: "copyview" },
      { code: "sub = df[mask].copy()", what: "An independent sub-table", lesson: "copyview" },
      { code: "df = df.op()", what: "Prefer reassignment over inplace=True", lesson: "copyview" },
    ],
  },
];

export function CheatsheetPage() {
  const setPage = useStore((s) => s.setPage);
  const [q, setQ] = useState("");
  const Search = getIcon("Search");
  const Arrow = getIcon("ArrowRight");

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      SHEET.map((group) => ({
        ...group,
        entries: needle
          ? group.entries.filter((e) =>
              `${e.code} ${e.what}`.toLowerCase().includes(needle),
            )
          : group.entries,
      })).filter((g) => g.entries.length > 0),
    [needle],
  );

  const total = SHEET.reduce((n, g) => n + g.entries.length, 0);
  const shown = filtered.reduce((n, g) => n + g.entries.length, 0);

  return (
    <PageShell meta={PAGES.cheatsheet}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="sidebar__search max-w-[320px] flex-1">
          <Search size={14} className="text-fg-subtle shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by method or description…"
            aria-label="Filter the cheat sheet"
          />
        </div>
        <span className="chip">
          {shown} of {total} entries
        </span>
      </div>

      {filtered.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h2 className="section-title">{group.title}</h2>
          <div className="card ref-group">
            {group.entries.map((e) => (
              <div key={e.code} className="ref-row">
                <code>{e.code}</code>
                <span className="flex items-center gap-2 justify-between">
                  <span>{e.what}</span>
                  <button
                    className="chip chip-accent shrink-0"
                    onClick={() => setPage(e.lesson)}
                    title={`Open the ${PAGES[e.lesson].title} lesson`}
                  >
                    {PAGES[e.lesson].short ?? PAGES[e.lesson].title}
                    <Arrow size={11} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="text-[13px] text-fg-muted">Nothing matched “{q}”.</p>
      )}
    </PageShell>
  );
}

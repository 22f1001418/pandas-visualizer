import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  hlRows,
  renameCols,
  resetIndex,
  setIndex,
  sortIndex,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.index                        # RangeIndex(0, 6)

df = df.set_index("name")       # a column becomes the row labels
df.loc["Diya"]                  # lookup by name

df = df.reset_index()           # and back again — name returns as a column
df.reset_index(drop=True)       # throw the old labels away

df.rename(columns={"score": "marks"})
df.sort_index(ascending=False)  # order rows by their LABEL`);

export function IndexingPage() {
  const byName = setIndex(STUDENTS, "name");
  const filtered = takeRows(
    STUDENTS,
    whereRows(STUDENTS, (r) => (r.score as number) > 80),
  );

  const steps: Step[] = [
    {
      id: "default",
      label: "The default index",
      code: "df.index",
      lines: L.at("df.index  "),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlRows([0, 1, 2, 3, 4, 5], "dim"),
          badge: "RangeIndex(0, 6)",
          note: "A RangeIndex stores no data at all — just start, stop and step. It is the cheapest possible index.",
        },
      ],
      explain:
        "Out of the box the index is positions dressed up as labels, which is why .loc and .iloc behave identically on a fresh frame. Everything interesting about the index starts when you replace it with something meaningful.",
    },
    {
      id: "set",
      label: 'set_index("name")',
      code: 'df = df.set_index("name")',
      lines: L.at('df.set_index("name")'),
      views: [
        { frame: STUDENTS, title: "df", muted: true },
        {
          frame: byName,
          title: 'df.set_index("name")',
          arrow: "move the column into the labels",
          badge: "4 columns left",
          note: "name is no longer in the body of the table — it moved into the label position. The frame went from 5 columns to 4.",
        },
      ],
      explain:
        "set_index promotes a column to row labels. The column leaves the data block, which is the part people forget: if you still need name as data, pass drop=False or reset it later.",
      outputs: [
        { label: "before", value: "6 × 5" },
        { label: "after", value: "6 × 4", tone: "accent" },
      ],
    },
    {
      id: "lookup",
      label: "Now lookups read like English",
      code: 'df.loc["Diya"]',
      lines: L.at('df.loc["Diya"]'),
      views: [
        {
          frame: byName,
          title: 'df.loc["Diya"]',
          highlights: hlRows([3], "key"),
          badge: "one row",
          note: "A hash lookup, not a scan. With a unique index pandas builds a hash table, so this stays fast on millions of rows.",
        },
      ],
      explain:
        "This is the payoff. df.loc['Diya'] says what it means, survives any reordering, and is far faster than df[df['name'] == 'Diya'], which has to compare every row.",
      variables: [
        { name: "df.index.is_unique", type: "bool", preview: "True" },
      ],
    },
    {
      id: "reset",
      label: "reset_index() puts it back",
      code: "df = df.reset_index()",
      lines: L.at("df.reset_index()  "),
      views: [
        {
          frame: STUDENTS,
          title: "df.reset_index()",
          badge: "name is a column again",
          note: "The old index was inserted as the first column, and a fresh RangeIndex took its place. A perfect round trip.",
        },
      ],
      explain:
        "reset_index is the inverse of set_index, and it is also what you call after a groupby to turn group keys back into ordinary columns. Expect to use it constantly.",
    },
    {
      id: "holes",
      label: "Filtering leaves holes",
      code: "df[df.score > 80]",
      lines: L.at("reset_index(drop=True)"),
      views: [
        {
          frame: filtered,
          title: "df[df.score > 80]",
          badge: "index 0,1,3,4",
          note: "Labels 0, 1, 3, 4 — label 2 (Ishaan) and 5 (Zoya) were filtered out. The gaps are deliberate.",
        },
        {
          frame: resetIndex(filtered),
          title: "…reset_index(drop=True)",
          arrow: "renumber",
          badge: "index 0,1,2,3",
          note: "drop=True discards the old labels instead of keeping them as a column. Use it when you no longer need to trace rows back.",
        },
      ],
      explain:
        "Gaps in the index are not corruption — they are provenance. Keep them while you are still working, and renumber at the end, just before you export or concatenate.",
    },
    {
      id: "rename",
      label: "rename · relabelling",
      code: 'df.rename(columns={"score": "marks"})',
      lines: L.at("df.rename(columns="),
      views: [
        {
          frame: renameCols(STUDENTS, { score: "marks" }),
          title: 'df.rename(columns={"score": "marks"})',
          highlights: { "*:2": "changed" },
          note: "Only the named keys change; every other column is left alone. Pass index={...} to relabel rows the same way.",
        },
      ],
      explain:
        "rename takes a dict of just the labels you want changed — far safer than assigning a whole new df.columns list, where a single misordered name silently mislabels your data.",
    },
    {
      id: "sort-index",
      label: "sort_index · order by label",
      code: "df.sort_index(ascending=False)",
      lines: L.at("df.sort_index"),
      views: [
        {
          frame: sortIndex(byName, false),
          title: "df.sort_index(ascending=False)",
          badge: "Z → A by name",
          note: "sort_index orders by the labels; sort_values orders by the contents. With a name index, sort_index is an alphabetical sort.",
        },
      ],
      explain:
        "Two different sorts, easy to confuse. sort_index is the one you want for time series — a DatetimeIndex sorted into chronological order — and it is required before label slicing like df.loc['2025-01':'2025-03'].",
    },
  ];

  return (
    <PageShell meta={PAGES.indexing}>
      <StepRunner runId="indexing" code={L.code} steps={steps} />
    </PageShell>
  );
}

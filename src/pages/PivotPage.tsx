import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { SALES_LONG } from "@/data/samples";
import { listing } from "@/lib/code";
import { hlCol, hlRows, rows } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.pivot(index="region", columns="month", values="revenue")

wide.melt(id_vars=["region"], var_name="month", value_name="revenue")

df.pivot(index="region", columns="month")      # duplicate pair -> ValueError
df.pivot_table(index="region", columns="month",
               values="revenue", aggfunc="mean")

df.pivot_table(index="region", columns="month", values="revenue",
               aggfunc="sum", margins=True)    # add totals`);

const WIDE = rows({
  columns: ["Jan", "Feb", "Mar"],
  index: ["North", "South"],
  indexName: "region",
  columnsName: "month",
  data: [
    [120, 145, 160],
    [90, 105, 130],
  ],
});

/** The same data with a duplicate (North, Jan) observation. */
const DUPED = rows({
  columns: ["region", "month", "revenue"],
  data: [
    ["North", "Jan", 120],
    ["North", "Jan", 100],
    ["North", "Feb", 145],
    ["South", "Jan", 90],
    ["South", "Feb", 105],
  ],
});

const AVERAGED = rows({
  columns: ["Feb", "Jan"],
  index: ["North", "South"],
  indexName: "region",
  columnsName: "month",
  data: [
    [145, 110],
    [105, 90],
  ],
  dtypes: { Feb: "float64", Jan: "float64" },
});

const MARGINS = rows({
  columns: ["Jan", "Feb", "Mar", "All"],
  index: ["North", "South", "All"],
  indexName: "region",
  columnsName: "month",
  data: [
    [120, 145, 160, 425],
    [90, 105, 130, 325],
    [210, 250, 290, 750],
  ],
});

export function PivotPage() {
  const steps: Step[] = [
    {
      id: "long",
      label: "Long format",
      code: "df",
      lines: L.at("df.pivot(index="),
      views: [
        {
          frame: SALES_LONG,
          title: "df",
          badge: "6 rows — one per observation",
          highlights: {
            ...hlCol(SALES_LONG, "region", "group-a"),
            ...hlCol(SALES_LONG, "month", "group-b"),
            ...hlCol(SALES_LONG, "revenue", "group-c"),
          },
          note: "Three roles, colour-coded: region will become the rows, month the columns, revenue the cell values. Every pivot is this decision.",
        },
      ],
      explain:
        "Long format stores one measurement per row, with its identity spelled out in label columns. It is how data is logged and stored — appending a new month needs no schema change — and it is the shape groupby and most plotting libraries want.",
      outputs: [
        { label: "rows", value: "6" },
        { label: "regions × months", value: "2 × 3" },
      ],
    },
    {
      id: "pivot",
      label: "pivot · long → wide",
      code: 'df.pivot(index="region", columns="month", values="revenue")',
      lines: L.at("df.pivot(index="),
      views: [
        {
          frame: WIDE,
          title: "wide",
          arrow: "rows ← region · columns ← month · cells ← revenue",
          badge: "2 × 3 matrix",
          highlights: { "0:0": "new", "0:1": "new", "0:2": "new" },
          note: "The same six numbers, rearranged. Both axes are now labelled — see 'region' in the corner and 'month' above the headers.",
        },
      ],
      explain:
        "Nothing is computed and nothing is lost: six values go in and six come out, just addressed differently. A human can read this layout at a glance, which is what wide format is for.",
      outputs: [
        { label: "values in", value: "6" },
        { label: "cells out", value: "6", tone: "success" },
      ],
    },
    {
      id: "melt",
      label: "melt · wide → long",
      code: 'wide.melt(id_vars=["region"], …)',
      lines: L.at("wide.melt("),
      views: [
        { frame: WIDE, title: "wide", muted: true },
        {
          frame: SALES_LONG,
          title: "melted",
          arrow: "fold the columns back into rows",
          badge: "back to 6 rows",
          highlights: hlCol(SALES_LONG, "month", "changed"),
          note: "The Jan/Feb/Mar headers became values in a month column. id_vars names the columns to keep as identifiers; everything else is folded.",
        },
      ],
      explain:
        "melt is pivot run backwards, and the operation you need far more often than you expect — because spreadsheets arrive wide and analysis wants long. var_name and value_name let you name the two new columns rather than accepting 'variable' and 'value'.",
    },
    {
      id: "error",
      label: "When pivot refuses",
      code: 'df.pivot(index="region", columns="month")',
      lines: L.at("# duplicate pair -> ValueError"),
      views: [
        {
          frame: DUPED,
          title: "df  ·  with a duplicate observation",
          highlights: hlRows([0, 1], "drop"),
          badge: "(North, Jan) twice",
          note: "Two rows claim the same (region, month) cell with different revenues: 120 and 100. One cell cannot hold both.",
        },
      ],
      stdout: `ValueError: Index contains duplicate entries, cannot reshape`,
      explain:
        "pivot is a pure rearrangement, so it has nowhere to put a second value for the same cell — and it refuses rather than picking one. The error is really a question: which of these two numbers did you mean, or how should they be combined?",
    },
    {
      id: "pivot-table",
      label: "pivot_table · pivot + aggregate",
      code: 'df.pivot_table(…, aggfunc="mean")',
      lines: L.range("df.pivot_table(index=", 'aggfunc="mean")'),
      views: [
        {
          frame: AVERAGED,
          title: 'pivot_table(aggfunc="mean")',
          badge: "duplicates averaged",
          highlights: { "0:1": "changed" },
          note: "(North, Jan) became 110 — the mean of 120 and 100. Every other cell had a single value, so averaging left it alone.",
        },
      ],
      explain:
        "pivot_table answers the question pivot could not. You supply aggfunc — mean, sum, count, max, or a list of them — and it reduces each cell's values. Note the default is 'mean', which quietly averages duplicates; pass aggfunc='sum' if that is what you meant.",
      outputs: [
        { label: "aggfunc default", value: "mean", tone: "warning" },
        { label: "cells aggregated", value: "1 of 4" },
      ],
    },
    {
      id: "margins",
      label: "margins=True · totals",
      code: "pivot_table(…, aggfunc='sum', margins=True)",
      lines: L.at("margins=True"),
      views: [
        {
          frame: MARGINS,
          title: "with margins",
          badge: "row and column totals",
          highlights: { "*:3": "new", "2:*": "new" },
          note: "An All column (each region's year total) and an All row (each month's across-region total). The corner, 750, is the grand total.",
        },
      ],
      explain:
        "This is the spreadsheet pivot table in one call, and it finishes a report properly. Watch out for the name clash, though — a category genuinely called 'All' collides with the margin label, so rename it first.",
    },
  ];

  return (
    <PageShell meta={PAGES.pivot}>
      <StepRunner runId="pivot" code={L.code} steps={steps} />
    </PageShell>
  );
}

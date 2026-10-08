import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { FEB_SALES, JAN_SALES, MAR_SALES } from "@/data/samples";
import { listing } from "@/lib/code";
import { hlRows, rows } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`pd.concat([jan, feb])                      # stack rows (axis=0)
pd.concat([jan, feb], ignore_index=True)   # …and renumber the index

pd.concat([jan, feb], keys=["jan", "feb"]) # label where each block came from

pd.concat([jan, mar])                      # mismatched columns -> NaN
pd.concat([jan, mar], join="inner")        # keep only shared columns

pd.concat([jan, feb], axis=1)              # side by side, aligned on the INDEX`);

const STACKED = rows({
  columns: ["region", "revenue"],
  index: [0, 1, 0, 1],
  data: [
    ["North", 120],
    ["South", 90],
    ["North", 145],
    ["South", 105],
  ],
});

const RENUMBERED = rows({
  columns: ["region", "revenue"],
  index: [0, 1, 2, 3],
  data: STACKED.data.map((r) => [...r]),
});

const KEYED = rows({
  columns: ["region", "revenue"],
  index: ["('jan', 0)", "('jan', 1)", "('feb', 0)", "('feb', 1)"],
  data: STACKED.data.map((r) => [...r]),
  indexName: "keys",
});

const RAGGED = rows({
  columns: ["region", "revenue", "refunds"],
  index: [0, 1, 0, 1],
  data: [
    ["North", 120, null],
    ["South", 90, null],
    ["North", 160, 12],
    ["South", 130, 4],
  ],
  dtypes: { revenue: "int64", refunds: "float64" },
});

const INNER = rows({
  columns: ["region", "revenue"],
  index: [0, 1, 0, 1],
  data: [
    ["North", 120],
    ["South", 90],
    ["North", 160],
    ["South", 130],
  ],
});

const SIDEWAYS = rows({
  columns: ["region", "revenue", "region", "revenue"],
  index: [0, 1],
  data: [
    ["North", 120, "North", 145],
    ["South", 90, "South", 105],
  ],
});

export function ConcatPage() {
  const steps: Step[] = [
    {
      id: "inputs",
      label: "Two monthly exports",
      code: "jan · feb",
      lines: L.at("pd.concat([jan, feb])  "),
      views: [
        { frame: JAN_SALES, title: "jan", badge: "2 rows" },
        { frame: FEB_SALES, title: "feb", badge: "2 rows" },
      ],
      explain:
        "Same schema, different periods — the classic case for concat. There is no key to match on here and nothing to look up; the frames simply need to become one table. That is the line between concat and merge.",
    },
    {
      id: "stack",
      label: "concat · stack the rows",
      code: "pd.concat([jan, feb])",
      lines: L.at("pd.concat([jan, feb])  "),
      views: [
        {
          frame: STACKED,
          title: "pd.concat([jan, feb])",
          badge: "4 rows",
          highlights: hlRows([2, 3], "new"),
          note: "Look at the index: 0, 1, 0, 1. Each frame brought its own labels along, so now there are two rows labelled 0.",
        },
      ],
      explain:
        "Rows are appended in the order you list the frames, and columns are matched by name rather than by position — so a frame whose columns are in a different order still lands correctly.",
      outputs: [
        { label: "rows", value: "2 + 2 = 4", tone: "accent" },
        { label: "index is unique", value: "False", tone: "warning" },
      ],
    },
    {
      id: "ignore",
      label: "ignore_index=True",
      code: "pd.concat([jan, feb], ignore_index=True)",
      lines: L.at("ignore_index=True"),
      views: [
        {
          frame: RENUMBERED,
          title: "ignore_index=True",
          badge: "index 0…3",
          highlights: { "*:0": "key" },
          note: "A single clean 0–3 index. The old labels are discarded rather than kept as a column.",
        },
      ],
      explain:
        "Almost always what you want when stacking rows. A duplicated index makes df.loc[0] return two rows, breaks later joins, and quietly produces wrong answers in anything that aligns on labels.",
    },
    {
      id: "keys",
      label: "keys= · remember the source",
      code: 'pd.concat([jan, feb], keys=["jan", "feb"])',
      lines: L.at("keys="),
      views: [
        {
          frame: KEYED,
          title: 'keys=["jan", "feb"]',
          badge: "MultiIndex",
          highlights: { "*:0": "group-a" },
          note: "The index is now a pair: the block label plus the original row label. ('jan', 0) and ('feb', 0) are different rows.",
        },
      ],
      explain:
        "The alternative to ignore_index when provenance matters. Loading twelve monthly files with keys=months gives you a frame you can immediately group by month — the information is in the index rather than lost.",
    },
    {
      id: "ragged",
      label: "Mismatched columns",
      code: "pd.concat([jan, mar])",
      lines: L.at("pd.concat([jan, mar])  "),
      views: [
        { frame: MAR_SALES, title: "mar", badge: "has an extra column", muted: true },
        {
          frame: RAGGED,
          title: "pd.concat([jan, mar])",
          arrow: "union of columns",
          highlights: { "0:2": "null", "1:2": "null" },
          badge: "3 columns",
          note: "March brought a refunds column that January does not have, so January's rows get NaN there. No error — and the integer column became float64.",
        },
      ],
      explain:
        "concat defaults to join='outer': the result has every column either frame had. That is forgiving, which is good for ragged real-world files and bad when the mismatch was a typo in a column name you meant to match.",
      outputs: [
        { label: "columns", value: "3", tone: "warning" },
        { label: "new NaN", value: "2 cells" },
      ],
    },
    {
      id: "join-inner",
      label: "join='inner' · shared columns only",
      code: 'pd.concat([jan, mar], join="inner")',
      lines: L.at('join="inner"'),
      views: [
        {
          frame: INNER,
          title: 'join="inner"',
          badge: "2 columns",
          note: "refunds is dropped entirely, because January has no such column. No NaN anywhere — but March's refund data is gone.",
        },
      ],
      explain:
        "A deliberate trade: a clean rectangle in exchange for silently discarding columns. Safer than it looks if you check the column count afterwards, dangerous if you do not.",
    },
    {
      id: "axis1",
      label: "axis=1 · side by side",
      code: "pd.concat([jan, feb], axis=1)",
      lines: L.at("axis=1)"),
      views: [
        {
          frame: SIDEWAYS,
          title: "pd.concat([jan, feb], axis=1)",
          badge: "2 rows × 4 columns",
          highlights: { "*:2": "new", "*:3": "new" },
          note: "Glued horizontally, matched on the index — and now there are two columns called region and two called revenue, which is rarely useful.",
        },
      ],
      explain:
        "With axis=1 the roles swap: rows are matched by label and columns are appended. The index alignment is the part to watch — mismatched indexes give you NaN rather than a positional zip, so reset both frames first if you truly mean 'line these up in order'.",
      outputs: [
        { label: "aligned on", value: "the index", tone: "accent" },
        { label: "duplicate names", value: "yes", tone: "warning" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.concat}>
      <StepRunner runId="concat" code={L.code} steps={steps} />
    </PageShell>
  );
}

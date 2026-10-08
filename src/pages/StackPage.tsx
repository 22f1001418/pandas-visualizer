import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { SALES_LONG } from "@/data/samples";
import { listing } from "@/lib/code";
import { hlRows, rows, sortValues } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`g = df.groupby(["region", "month"])["revenue"].sum()   # 2-level MultiIndex

g.unstack()              # inner level (month) -> columns
g.unstack().stack()      # and back again

g.loc[("North", "Jan")]  # select with a tuple
g.xs("Jan", level="month")   # one level, any position

g.reset_index()          # flatten the MultiIndex into columns

g.swaplevel().sort_index()   # month outermost instead
g.unstack(level=0)           # lift region instead of month`);

const MULTI = rows({
  columns: ["revenue"],
  index: [
    "North  ·  Feb",
    "North  ·  Jan",
    "North  ·  Mar",
    "South  ·  Feb",
    "South  ·  Jan",
    "South  ·  Mar",
  ],
  indexName: "region · month",
  data: [[145], [120], [160], [105], [90], [130]],
});

const UNSTACKED = rows({
  columns: ["Feb", "Jan", "Mar"],
  index: ["North", "South"],
  indexName: "region",
  columnsName: "month",
  data: [
    [145, 120, 160],
    [105, 90, 130],
  ],
});

const UNSTACKED_0 = rows({
  columns: ["North", "South"],
  index: ["Feb", "Jan", "Mar"],
  indexName: "month",
  columnsName: "region",
  data: [
    [145, 105],
    [120, 90],
    [160, 130],
  ],
});

const XS = rows({
  columns: ["revenue"],
  index: ["North", "South"],
  indexName: "region",
  data: [[120], [90]],
});

const FLAT = rows({
  columns: ["region", "month", "revenue"],
  data: [
    ["North", "Feb", 145],
    ["North", "Jan", 120],
    ["North", "Mar", 160],
    ["South", "Feb", 105],
    ["South", "Jan", 90],
    ["South", "Mar", 130],
  ],
});

const SWAPPED = rows({
  columns: ["revenue"],
  index: [
    "Feb  ·  North",
    "Feb  ·  South",
    "Jan  ·  North",
    "Jan  ·  South",
    "Mar  ·  North",
    "Mar  ·  South",
  ],
  indexName: "month · region",
  data: [[145], [105], [120], [90], [160], [130]],
});

export function StackPage() {
  const steps: Step[] = [
    {
      id: "multi",
      label: "Two keys → a MultiIndex",
      code: 'df.groupby(["region", "month"])["revenue"].sum()',
      lines: L.at("g = df.groupby("),
      views: [
        { frame: sortValues(SALES_LONG, ["region", "month"]), title: "df", muted: true },
        {
          frame: MULTI,
          title: "g",
          series: true,
          arrow: "group by two keys",
          badge: "2 index levels",
          note: "One row per (region, month) pair. The index holds two labels per row — that is a MultiIndex, and this is the usual way you end up with one.",
        },
      ],
      explain:
        "Group by two keys and the result is indexed by both. The levels are nested: region on the outside, month on the inside, each level sorted. Most people meet MultiIndex here rather than by creating one deliberately.",
      variables: [
        { name: "g.index.nlevels", type: "int", preview: "2" },
        { name: "len(g)", type: "int", preview: "6" },
      ],
    },
    {
      id: "unstack",
      label: "unstack · inner level → columns",
      code: "g.unstack()",
      lines: L.at("g.unstack()  "),
      views: [
        {
          frame: UNSTACKED,
          title: "g.unstack()",
          arrow: "lift month onto the column axis",
          badge: "2 × 3 DataFrame",
          highlights: { "*:0": "new", "*:1": "new", "*:2": "new" },
          note: "The six-row Series became a 2 × 3 table. month moved from the index up to the headers, and region stayed as the index.",
        },
      ],
      explain:
        "unstack takes the innermost index level and spreads it across the columns, which turns a tall Series into a wide frame. It is the same transformation pivot performs, reached from an aggregation rather than from raw rows — and after a two-key groupby it is usually the next thing you want.",
      outputs: [
        { label: "before", value: "6 × 1" },
        { label: "after", value: "2 × 3", tone: "accent" },
      ],
    },
    {
      id: "stack",
      label: "stack · and back again",
      code: "g.unstack().stack()",
      lines: L.at("g.unstack().stack()"),
      views: [
        {
          frame: MULTI,
          title: "…stack()",
          series: true,
          badge: "round trip",
          highlights: hlRows([0, 1, 2, 3, 4, 5], "changed"),
          note: "Identical to where we started. stack pushes the innermost column level back down into the index.",
        },
      ],
      explain:
        "The two are exact inverses: stack makes a table taller and narrower, unstack wider and shorter. One caveat — stack drops missing combinations by default, so a frame with empty cells does not survive the round trip unless you pass dropna=False.",
    },
    {
      id: "select",
      label: "Selecting from two levels",
      code: 'g.loc[("North", "Jan")]',
      lines: L.at("g.loc[(\"North\", \"Jan\")]"),
      views: [
        {
          frame: MULTI,
          title: "g",
          highlights: hlRows([1], "key"),
          badge: "→ 120",
          note: "A tuple addresses both levels at once. Partial selection works too: g.loc['North'] returns that region's three months.",
        },
      ],
      explain:
        "Think of the index as a composite key. Give the full tuple for one value, the outer label alone for a slice. The index must be sorted for range slicing to work — if it is not, pandas raises UnsortedIndexError and sort_index() is the fix.",
      outputs: [
        { label: 'loc[("North","Jan")]', value: "120", tone: "accent" },
        { label: 'loc["North"]', value: "3 rows" },
      ],
    },
    {
      id: "xs",
      label: "xs · slice one level",
      code: 'g.xs("Jan", level="month")',
      lines: L.at("g.xs("),
      views: [
        {
          frame: XS,
          title: 'g.xs("Jan", level="month")',
          series: true,
          badge: "January, both regions",
          highlights: { "*:0": "match" },
          note: "Cutting across the inner level. The month level is consumed by the selection, leaving region as the index.",
        },
      ],
      explain:
        "xs — cross-section — selects by a named level wherever it sits in the hierarchy, which is far more readable than counting positions or writing slice(None) in a tuple.",
    },
    {
      id: "reset",
      label: "reset_index · flatten it",
      code: "g.reset_index()",
      lines: L.at("g.reset_index()"),
      views: [
        {
          frame: FLAT,
          title: "g.reset_index()",
          badge: "3 flat columns",
          highlights: { "*:0": "key", "*:1": "key" },
          note: "Both index levels became ordinary columns, and the result is long-format data again — ready to merge, plot or export.",
        },
      ],
      explain:
        "The pragmatic escape hatch. MultiIndex selection is powerful but fiddly, and most downstream tools want flat columns. Flattening right after the aggregation is a perfectly respectable habit.",
    },
    {
      id: "swap",
      label: "swaplevel · reorder the levels",
      code: "g.swaplevel().sort_index()",
      lines: L.at("g.swaplevel()"),
      views: [
        {
          frame: SWAPPED,
          title: "g.swaplevel().sort_index()",
          series: true,
          badge: "month outermost",
          highlights: { "*:0": "changed" },
          note: "Now grouped by month first, region second. The sort_index() is required — swaplevel alone leaves the index in its old, now unsorted, order.",
        },
      ],
      explain:
        "Which level sits outermost decides what you can slice efficiently and how the output reads. Swap and re-sort when you want the other view; droplevel removes a level you no longer need.",
    },
    {
      id: "level0",
      label: "unstack(level=0)",
      code: "g.unstack(level=0)",
      lines: L.at("g.unstack(level=0)"),
      views: [
        {
          frame: UNSTACKED_0,
          title: "g.unstack(level=0)",
          badge: "transposed",
          highlights: { "*:0": "group-a", "*:1": "group-b" },
          note: "Region lifted to the columns instead of month, giving the transpose of the earlier result: 3 × 2 rather than 2 × 3.",
        },
      ],
      explain:
        "level picks which index level moves up; the default -1 means the innermost. Choosing it is how you decide the orientation of your final table — months down the side or across the top, whichever makes the comparison you care about easier to read.",
    },
  ];

  return (
    <PageShell meta={PAGES.stack}>
      <StepRunner runId="stack" code={L.code} steps={steps} />
    </PageShell>
  );
}

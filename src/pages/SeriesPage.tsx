import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { listing } from "@/lib/code";
import { hlCells, hlRows, rows, series } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`scores = pd.Series([91, 88, 74, 95, 82, 68])

scores = pd.Series(
    [91, 88, 74, 95, 82, 68],
    index=["Aarav", "Priya", "Ishaan", "Diya", "Kabir", "Zoya"],
    name="score",
)

scores * 2             # element-wise — no Python loop
scores > 80            # a boolean Series, same length
scores.mean()          # collapses to one scalar
scores.loc["Priya"]    # by label    -> 88
scores.iloc[1]         # by position -> 88

s1 + s2                # aligns on the INDEX, not on position`);

const NAMES = ["Aarav", "Priya", "Ishaan", "Diya", "Kabir", "Zoya"];
const VALUES = [91, 88, 74, 95, 82, 68];

const plain = series("score", VALUES);
const named = series("score", VALUES, { index: NAMES });
const doubled = series("score", VALUES.map((v) => v * 2), { index: NAMES });
const mask = series("score > 80", VALUES.map((v) => v > 80), { index: NAMES });

const S1 = series("s1", [1, 2, 3], { index: ["Aarav", "Priya", "Ishaan"] });
const S2 = series("s2", [10, 20, 30], { index: ["Priya", "Ishaan", "Diya"] });
const SUM = rows({
  columns: ["s1 + s2"],
  index: ["Aarav", "Diya", "Ishaan", "Priya"],
  data: [[null], [null], [23], [12]],
  dtypes: { "s1 + s2": "float64" },
});

const DESCRIBE = rows({
  columns: ["score"],
  index: ["count", "mean", "std", "min", "25%", "50%", "75%", "max"],
  data: [[6], [83], [10.39], [68], [76], [85], [90.25], [95]],
  dtypes: { score: "float64" },
});

export function SeriesPage() {
  const steps: Step[] = [
    {
      id: "plain",
      label: "From a list",
      code: "pd.Series([91, 88, 74, 95, 82, 68])",
      lines: L.at("scores = pd.Series([91"),
      views: [
        {
          frame: plain,
          title: "scores",
          series: true,
          badge: "Series",
          dtypes: true,
          note: "Two columns are printed but only one holds data. The left column is the index pandas generated for you: 0 through 5.",
        },
      ],
      explain:
        "A Series is values plus labels. Hand it a bare list and pandas supplies a default integer index, so every value ends up with both a position and a label — and here they happen to be the same number.",
      variables: [
        { name: "scores", type: "Series[int64]", preview: "6 values" },
      ],
    },
    {
      id: "named",
      label: "With real labels",
      code: "pd.Series(values, index=names, name='score')",
      lines: L.range("scores = pd.Series(", ")"),
      views: [
        {
          frame: named,
          title: "scores",
          series: true,
          badge: 'name="score"',
          note: "Now the labels mean something. The values did not move — only their names changed.",
        },
      ],
      explain:
        "Give it an explicit index and the Series becomes an ordered dictionary with a dtype: label-based lookup, but stored as one contiguous typed array. That combination is the whole point of pandas.",
      variables: [
        { name: "scores.index", type: "Index", preview: "Aarav … Zoya" },
      ],
    },
    {
      id: "arith",
      label: "Element-wise arithmetic",
      code: "scores * 2",
      lines: L.at("scores * 2"),
      views: [
        { frame: named, title: "scores", series: true, muted: true },
        {
          frame: doubled,
          title: "scores * 2",
          series: true,
          arrow: "× 2, all six at once",
          highlights: hlRows([0, 1, 2, 3, 4, 5], "changed"),
          note: "Six multiplications, one instruction. No loop was written and none ran in Python.",
        },
      ],
      explain:
        "A scalar operation broadcasts across every element. The result keeps the same index and the same length — which is exactly why you can assign it straight back as a new column.",
    },
    {
      id: "mask",
      label: "Comparison → boolean Series",
      code: "scores > 80",
      lines: L.at("scores > 80"),
      views: [
        {
          frame: mask,
          title: "scores > 80",
          series: true,
          highlights: {
            ...hlCells([[0, 0], [1, 0], [3, 0], [4, 0]], "mask-true"),
            ...hlCells([[2, 0], [5, 0]], "mask-false"),
          },
          dtypes: true,
          note: "Same length, same index, dtype=bool. This object is what filtering consumes.",
        },
      ],
      outputs: [
        { label: "mask.sum()", value: "4", tone: "success" },
        { label: "mask.all()", value: "False" },
        { label: "mask.any()", value: "True" },
      ],
      explain:
        "A comparison does not filter anything — it answers the question once per element and hands you the answers. Keeping that object separate from the filtering step is the key to reading pandas code.",
    },
    {
      id: "agg",
      label: "Aggregation → one scalar",
      code: "scores.mean()",
      lines: L.at("scores.mean()"),
      views: [
        {
          frame: DESCRIBE,
          title: "scores.describe()",
          badge: "every statistic at once",
          note: "describe() is eight aggregations in one call — count, mean, std, min, three quartiles and max.",
        },
      ],
      outputs: [
        { label: "mean", value: "83.0", tone: "accent" },
        { label: "max", value: "95" },
        { label: "idxmax", value: "Diya", tone: "pink" },
      ],
      explain:
        "An aggregation collapses the Series to a single value, dropping the index entirely. idxmax is the useful cousin: instead of the largest value, it returns the label that carries it.",
    },
    {
      id: "lookup",
      label: "loc by label · iloc by position",
      code: 'scores.loc["Priya"]  vs  scores.iloc[1]',
      lines: L.at('scores.loc["Priya"]', "scores.iloc[1]"),
      views: [
        {
          frame: named,
          title: "scores",
          highlights: hlCells([[1, 0]], "key"),
          badge: "both land here",
          note: 'Only by coincidence: "Priya" is at position 1 right now. Sort the Series and the label still finds her, while position 1 finds somebody else.',
        },
      ],
      explain:
        "Two addressing schemes for the same data. .loc asks 'which label', .iloc asks 'which slot'. They agree on an unsorted default index and diverge the moment you sort or filter.",
    },
    {
      id: "align",
      label: "Index alignment",
      code: "s1 + s2",
      lines: L.at("s1 + s2"),
      views: [
        { frame: S1, title: "s1", series: true },
        { frame: S2, title: "s2", series: true },
        {
          frame: SUM,
          title: "s1 + s2",
          series: true,
          arrow: "match on labels, then add",
          highlights: {
            ...hlCells([[0, 0], [1, 0]], "null"),
            ...hlCells([[2, 0], [3, 0]], "new"),
          },
          note: "Priya and Ishaan appear in both, so they add: 2+10=12 and 3+20=23. Aarav and Diya appear in only one, so there is nothing to add — NaN. And note the result is sorted.",
        },
      ],
      explain:
        "This is the behaviour that surprises everyone. pandas lines the two Series up by label before adding, not by position — and the result is the union of both indexes. Mismatched labels give NaN, not an error.",
      variables: [
        { name: "result", type: "Series[float64]", preview: "2 NaN, 2 values" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.series}>
      <StepRunner runId="series" code={L.code} steps={steps} />
    </PageShell>
  );
}

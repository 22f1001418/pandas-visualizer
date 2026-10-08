import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  aggregate,
  assign,
  col,
  groupRows,
  hlByGroup,
  rows,
  takeRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`g = df.groupby("batch")

g.agg(avg=("score", "mean"), n=("score", "count"))   # 1 row per GROUP

df["batch_avg"] = g["score"].transform("mean")       # 1 row per ROW
df["vs_batch"]  = df["score"] - df["batch_avg"]

g.filter(lambda d: d["score"].mean() > 80)           # keep whole GROUPS

g.agg(["mean", "max"])        # MultiIndex columns — needs flattening
g["score"].agg(["mean", "max"])`);

const GROUPS = groupRows(STUDENTS, "batch");
const scores = col(STUDENTS, "score") as number[];
const batches = col(STUDENTS, "batch") as string[];

const groupMean = new Map<string, number>();
GROUPS.forEach((idxs, k) =>
  groupMean.set(
    k,
    aggregate(idxs.map((i) => STUDENTS.data[i][2]), "mean") as number,
  ),
);

const broadcast = batches.map((b) => groupMean.get(b) as number);
const deviation = scores.map(
  (s, i) => Math.round((s - broadcast[i]) * 100) / 100,
);

const AGG = rows({
  columns: ["avg", "n"],
  index: [...groupMean.keys()],
  indexName: "batch",
  data: [...groupMean.entries()].map(([k, v]) => [
    v,
    (GROUPS.get(k) ?? []).length,
  ]),
  dtypes: { avg: "float64", n: "int64" },
});

const WITH_AVG = assign(STUDENTS, "batch_avg", broadcast, "float64");
const WITH_DEV = assign(WITH_AVG, "vs_batch", deviation, "float64");

const keptGroups = [...GROUPS.entries()]
  .filter(([k]) => (groupMean.get(k) as number) > 80)
  .flatMap(([, idxs]) => idxs);

const MULTI = rows({
  columns: ["score mean", "score max", "attempts mean", "attempts max"],
  index: [...groupMean.keys()],
  indexName: "batch",
  data: [...GROUPS.entries()].map(([, idxs]) => [
    aggregate(idxs.map((i) => STUDENTS.data[i][2]), "mean"),
    aggregate(idxs.map((i) => STUDENTS.data[i][2]), "max"),
    aggregate(idxs.map((i) => STUDENTS.data[i][3]), "mean"),
    aggregate(idxs.map((i) => STUDENTS.data[i][3]), "max"),
  ]),
  dtypes: {
    "score mean": "float64",
    "score max": "int64",
    "attempts mean": "float64",
    "attempts max": "int64",
  },
});

export function AggregatePage() {
  const steps: Step[] = [
    {
      id: "three",
      label: "Three questions, one grouping",
      code: 'g = df.groupby("batch")',
      lines: L.at('g = df.groupby("batch")'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlByGroup(STUDENTS, "batch"),
          badge: "2 groups",
          note: "Same split as the groupby lesson. What changes here is the shape of the answer you ask for.",
        },
      ],
      explain:
        "Three different questions sit on top of the same grouping. 'What is the average per batch?' needs one row per group. 'How far is this student from their batch average?' needs one row per student. 'Which batches are strong?' needs whole groups kept or dropped. agg, transform and filter are those three answers.",
    },
    {
      id: "agg",
      label: "agg · one row per group",
      code: 'g.agg(avg=("score", "mean"), n=("score", "count"))',
      lines: L.at("g.agg(avg="),
      views: [
        {
          frame: AGG,
          title: "g.agg(…)",
          badge: "6 rows → 2 rows",
          highlights: { "0:*": "group-a", "1:*": "group-b" },
          note: "The frame shrank to one row per group, indexed by the key. This is a reduction.",
        },
      ],
      explain:
        "agg reduces. Each group's values collapse to a single number per metric, and the result is as tall as the number of groups. Use it for reports and summaries — anything where the group itself is the unit of analysis.",
      outputs: [
        { label: "input rows", value: "6" },
        { label: "output rows", value: "2", tone: "accent" },
      ],
    },
    {
      id: "transform",
      label: "transform · one row per row",
      code: 'g["score"].transform("mean")',
      lines: L.at('transform("mean")'),
      views: [
        {
          frame: WITH_AVG,
          title: 'df["batch_avg"]',
          highlights: { "*:5": "new" },
          badge: "6 rows → 6 rows",
          note: "The same two numbers as agg produced — 91.33 and 74.67 — but written back onto every row of their group. Three rows share each value.",
        },
      ],
      explain:
        "transform computes per group and then broadcasts the result back over that group's rows, so the output length always matches the input. That is what makes it assignable straight back as a column, which agg can never be.",
      variables: [
        { name: "transform output", type: "Series", preview: "6 values" },
        { name: "agg output", type: "Series", preview: "2 values" },
      ],
    },
    {
      id: "relative",
      label: "What transform is for",
      code: 'df["score"] - g["score"].transform("mean")',
      lines: L.at('df["vs_batch"]'),
      views: [
        {
          frame: WITH_DEV,
          title: 'df["vs_batch"]',
          highlights: {
            "*:6": "changed",
            "4:6": "new",
            "5:6": "drop",
          },
          badge: "group-relative",
          note: "Kabir is +7.33 against SWE's average while Zoya is −6.67. Priya's −3.33 looks poor until you notice DSML's average is 17 points higher than SWE's.",
        },
      ],
      explain:
        "This is the payoff and the reason transform exists: comparing each row against its own group rather than against the whole dataset. Standardising within group, subtracting a group baseline, computing a share of group total — all of it is transform.",
      outputs: [
        { label: "Kabir vs SWE", value: "+7.33", tone: "success" },
        { label: "Priya vs DSML", value: "−3.33", tone: "warning" },
      ],
    },
    {
      id: "filter",
      label: "filter · keep whole groups",
      code: 'g.filter(lambda d: d["score"].mean() > 80)',
      lines: L.at("g.filter("),
      views: [
        {
          frame: takeRows(STUDENTS, keptGroups),
          title: "g.filter(…)",
          highlights: hlByGroup(STUDENTS, "batch"),
          badge: `${keptGroups.length} rows, 1 group`,
          note: "DSML averages 91.33 so all three of its rows stay. SWE averages 74.67, so all three of its rows go — including Kabir's 82, which would have passed the test on its own.",
        },
      ],
      explain:
        "filter's predicate receives the whole sub-frame and returns one True or False for it. Every row of a passing group is kept and every row of a failing group is dropped. Note how different that is from a row filter: individual values do not get a vote.",
      outputs: [
        { label: "groups in", value: "2" },
        { label: "groups out", value: "1", tone: "accent" },
      ],
    },
    {
      id: "multiindex",
      label: "The MultiIndex you get for free",
      code: 'g.agg(["mean", "max"])',
      lines: L.at('g.agg(["mean", "max"])'),
      views: [
        {
          frame: MULTI,
          title: 'g.agg(["mean", "max"])',
          badge: "2 metrics × 2 columns",
          note: "Four columns, each really a pair of labels: ('score','mean'), ('score','max'), ('attempts','mean'), ('attempts','max'). pandas stores that as a MultiIndex on the columns.",
        },
      ],
      explain:
        "A list of functions applied to several columns gives you two-level column labels, and every reference afterwards needs a tuple: df[('score','mean')]. Named aggregation avoids all of it — which is exactly why it was added.",
      outputs: [
        { label: "list form", value: "MultiIndex", tone: "warning" },
        { label: "named form", value: "flat", tone: "success" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.aggregate}>
      <StepRunner runId="aggregate" code={L.code} steps={steps} />
    </PageShell>
  );
}

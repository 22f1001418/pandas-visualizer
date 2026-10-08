import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS, STUDENTS_WITH_NA } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  aggregate,
  col,
  groupAgg,
  groupRows,
  hlByGroup,
  hlCol,
  resetIndex,
  rows,
  takeRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`groups = df.groupby("batch")       # lazy — nothing computed yet

for name, grp in groups:           # each group is a mini-DataFrame
    print(name, len(grp))

df.groupby("batch")["score"].mean()            # split · apply · combine

df.groupby("batch", as_index=False)["score"].mean()   # key as a column

df.groupby("batch").agg(
    avg_score=("score", "mean"),
    n_students=("score", "count"),
    max_attempts=("attempts", "max"),
)

df.groupby("batch").size()         # rows per group
df.groupby("batch", dropna=False)  # keep the NaN key as a group`);

const GROUPS = groupRows(STUDENTS, "batch");
const DSML = GROUPS.get("DSML") ?? [];
const SWE = GROUPS.get("SWE") ?? [];

const meanOf = (idxs: number[]) =>
  aggregate(idxs.map((i) => STUDENTS.data[i][2]), "mean") as number;

const MEANS = groupAgg(STUDENTS, "batch", "score", "mean");

const AGG = rows({
  columns: ["avg_score", "n_students", "max_attempts"],
  index: ["DSML", "SWE"],
  indexName: "batch",
  data: [
    [meanOf(DSML), DSML.length, aggregate(DSML.map((i) => STUDENTS.data[i][3]), "max")],
    [meanOf(SWE), SWE.length, aggregate(SWE.map((i) => STUDENTS.data[i][3]), "max")],
  ],
  dtypes: { avg_score: "float64", n_students: "int64", max_attempts: "int64" },
});

const NA_GROUPS = groupAgg(STUDENTS_WITH_NA, "batch", "score", "count");

export function GroupByPage() {
  const steps: Step[] = [
    {
      id: "start",
      label: "The question",
      code: "df",
      lines: L.at('groups = df.groupby("batch")'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlCol(STUDENTS, "batch", "match"),
          note: "We want the average score per batch. The batch column is the key — two distinct values across six rows.",
        },
      ],
      explain:
        "Every groupby starts by identifying the key: the column whose repeated values define the buckets. A column with 6 distinct values out of 6 rows is an id, not a key; batch, with 2 out of 6, is exactly right.",
      outputs: [
        { label: "rows", value: "6" },
        { label: "distinct batches", value: "2", tone: "accent" },
      ],
    },
    {
      id: "split",
      label: "SPLIT · partition the rows",
      code: 'df.groupby("batch")',
      lines: L.at('groups = df.groupby("batch")'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlByGroup(STUDENTS, "batch"),
          badge: "coloured by group",
          note: "Blue rows are DSML, pink rows are SWE. Nothing has moved and nothing has been computed — pandas has merely recorded which row positions belong to which key.",
        },
      ],
      explain:
        "groupby is lazy. It returns a DataFrameGroupBy object holding a mapping from key to row positions, and that is all. No arithmetic happens until you ask for an aggregation, which is why groupby on its own is instant even on a huge frame.",
      variables: [
        {
          name: "groups",
          type: "DataFrameGroupBy",
          preview: "DSML: 3, SWE: 3",
        },
      ],
    },
    {
      id: "mini",
      label: "Two mini-DataFrames",
      code: "for name, grp in groups: …",
      lines: L.range("for name, grp in groups:", "print(name, len(grp))"),
      views: [
        {
          frame: takeRows(STUDENTS, DSML),
          title: '"DSML"',
          badge: `${DSML.length} rows`,
          highlights: hlCol(STUDENTS, "score", "group-a"),
          note: "Index labels 0, 1, 3 — these are still the original rows.",
        },
        {
          frame: takeRows(STUDENTS, SWE),
          title: '"SWE"',
          badge: `${SWE.length} rows`,
          highlights: hlCol(STUDENTS, "score", "group-b"),
          note: "Index labels 2, 4, 5. Each group is a complete DataFrame in its own right.",
        },
      ],
      explain:
        "This is the mental picture worth keeping: the frame cut into independent mini-frames, each with every column intact. Whatever you do next will be done to each one separately, with no knowledge of the others.",
    },
    {
      id: "apply",
      label: "APPLY · reduce each group",
      code: 'groups["score"].mean()',
      lines: L.at('df.groupby("batch")["score"].mean()'),
      views: [
        {
          frame: takeRows(STUDENTS, DSML),
          title: '"DSML"',
          badge: `mean(91, 88, 95) = ${meanOf(DSML).toFixed(2)}`,
          highlights: hlCol(STUDENTS, "score", "group-a"),
        },
        {
          frame: takeRows(STUDENTS, SWE),
          title: '"SWE"',
          badge: `mean(74, 82, 68) = ${meanOf(SWE).toFixed(2)}`,
          highlights: hlCol(STUDENTS, "score", "group-b"),
        },
      ],
      explain:
        "The aggregation runs once per group, over that group's values only. Three numbers in, one number out, twice. Because each group is independent, pandas can do this work in parallel over a single pass of the column.",
      outputs: [
        { label: "DSML", value: meanOf(DSML).toFixed(2), tone: "accent" },
        { label: "SWE", value: meanOf(SWE).toFixed(2), tone: "pink" },
      ],
    },
    {
      id: "combine",
      label: "COMBINE · stitch it back",
      code: 'df.groupby("batch")["score"].mean()',
      lines: L.at('df.groupby("batch")["score"].mean()'),
      views: [
        {
          frame: MEANS,
          title: 'df.groupby("batch")["score"].mean()',
          series: true,
          badge: "one row per group",
          highlights: { "0:0": "group-a", "1:0": "group-b" },
          note: "The group keys became the INDEX — note the 'batch' label in the corner — and the aggregated values became the single column.",
        },
      ],
      explain:
        "Six rows in, two rows out, indexed by the key. That shape change is the signature of an aggregation, and the key landing in the index is what trips people up next: there is no 'batch' column in this result to filter or merge on.",
      variables: [
        { name: "result", type: "Series[float64]", preview: "2 values" },
      ],
    },
    {
      id: "as-index",
      label: "as_index=False · key as a column",
      code: 'df.groupby("batch", as_index=False)["score"].mean()',
      lines: L.at("as_index=False"),
      views: [
        {
          frame: resetIndex(
            rows({
              columns: ["batch", "score"],
              data: [
                ["DSML", meanOf(DSML)],
                ["SWE", meanOf(SWE)],
              ],
              dtypes: { score: "float64" },
            }),
          ),
          title: "as_index=False",
          badge: "a flat DataFrame",
          highlights: { "*:0": "key" },
          note: "Same numbers, different shape: batch is an ordinary column again and the index is a plain 0,1. Equivalent to chaining .reset_index().",
        },
      ],
      explain:
        "Use this whenever the result is going onwards — into a merge, a plot, a CSV. Most tools want the key as a column, not as an index, and asking for it up front saves a reset_index at every step of the chain.",
    },
    {
      id: "agg",
      label: "agg · several metrics at once",
      code: "df.groupby('batch').agg(avg_score=…, n_students=…)",
      lines: L.range('df.groupby("batch").agg(', ")"),
      views: [
        {
          frame: AGG,
          title: ".agg(…)",
          badge: "3 metrics × 2 groups",
          highlights: { "*:0": "new", "*:1": "new", "*:2": "new" },
          note: "One pass over the data produces all three columns. Each output is named by you, so there is no MultiIndex to untangle afterwards.",
        },
      ],
      explain:
        "Named aggregation — output=(column, function) — is the modern form and the one to learn. It replaces three separate groupby chains, and the column names come out flat and readable.",
    },
    {
      id: "size",
      label: "size vs count",
      code: 'df.groupby("batch").size()',
      lines: L.at('df.groupby("batch").size()'),
      views: [
        {
          frame: NA_GROUPS,
          title: 'groupby("batch")["score"].count()',
          series: true,
          badge: "non-null per group",
          note: "On the frame with missing data these differ: count() skips NaN scores, while size() would report the full row count per group.",
        },
      ],
      explain:
        "size() counts rows; count() counts non-null values, per column. When they disagree you have found missing data — and in a report, 'number of students' and 'number of students with a score' are different claims.",
      outputs: [
        { label: "size()", value: "rows", tone: "accent" },
        { label: "count()", value: "non-null", tone: "pink" },
      ],
    },
    {
      id: "dropna",
      label: "The silently dropped rows",
      code: 'df.groupby("batch", dropna=False)',
      lines: L.at("dropna=False"),
      views: [
        {
          frame: STUDENTS_WITH_NA,
          title: "df  ·  with a missing batch",
          highlights: hlCol(STUDENTS_WITH_NA, "batch", "null"),
          badge: "row 3 has no key",
          note: "Diya's batch is NaN. By default groupby drops her row entirely — she is in no group, so she appears in no total.",
        },
      ],
      explain:
        "This is the groupby bug that does not announce itself: your group totals no longer add up to the frame total, and nothing warned you. Either pass dropna=False to get an explicit NaN group, or fill the key first — but check, every time.",
      outputs: [
        { label: "rows in frame", value: "6" },
        { label: "rows in groups", value: "5", tone: "danger" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.groupby}>
      <StepRunner runId="groupby" code={L.code} steps={steps} />
    </PageShell>
  );
}

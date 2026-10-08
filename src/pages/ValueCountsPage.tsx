import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { SIGNUPS, STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  col,
  hlCol,
  resetIndex,
  rows,
  series,
  valueCounts,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df["plan"].value_counts()                  # counts, descending
df["plan"].value_counts(normalize=True)    # shares, summing to 1
df["plan"].value_counts(dropna=False)      # NaN as its own category

df["plan"].unique()      # the distinct values, in order of appearance
df["plan"].nunique()     # just how many
df["plan"].mode()        # the most common one

pd.crosstab(students["batch"], students["passed"])   # two-way table

df["plan"].value_counts().reset_index()    # back to a tidy frame`);

const COUNTS = valueCounts(SIGNUPS, "plan");
const planValues = col(SIGNUPS, "plan") as string[];
const total = planValues.length;

const SHARES = series(
  "proportion",
  (col(COUNTS, "count") as number[]).map(
    (c) => Math.round((c / total) * 100) / 100,
  ),
  { index: COUNTS.index, indexName: "plan" },
);

const CROSS = rows({
  columns: ["False", "True"],
  index: ["DSML", "SWE"],
  indexName: "batch",
  columnsName: "passed",
  data: [
    [0, 3],
    [1, 2],
  ],
});

const TIDY = resetIndex(
  rows({
    columns: ["plan", "count"],
    data: COUNTS.index.map((k, i) => [String(k), COUNTS.data[i][0]]),
  }),
);

export function ValueCountsPage() {
  const steps: Step[] = [
    {
      id: "raw",
      label: "A categorical column",
      code: 'df["plan"]',
      lines: L.at('df["plan"].value_counts()  '),
      views: [
        {
          frame: SIGNUPS,
          title: "df",
          highlights: hlCol(SIGNUPS, "plan", "match"),
          note: "Six rows, three distinct plans. Counting by eye is easy here and impossible on a real table — which is the whole reason value_counts exists.",
        },
      ],
      explain:
        "The first question to ask of any categorical column: what are the categories, and how are the rows distributed across them? Skew, typos and unexpected categories all show up in the answer.",
    },
    {
      id: "counts",
      label: "value_counts()",
      code: 'df["plan"].value_counts()',
      lines: L.at('df["plan"].value_counts()  '),
      views: [
        {
          frame: COUNTS,
          title: 'df["plan"].value_counts()',
          series: true,
          highlights: { "0:0": "group-a", "1:0": "group-b", "2:0": "group-c" },
          badge: "sorted by frequency",
          note: "free 3, pro 2, max 1. The distinct values became the INDEX — note the 'plan' label in the corner — and the counts are the values.",
        },
      ],
      explain:
        "Descending by count, not alphabetical: the most common category is first, which is almost always what you want to see. The long tail at the bottom is where misspellings and junk categories hide.",
      outputs: [
        { label: "most common", value: "free (3)", tone: "accent" },
        { label: "categories", value: "3" },
      ],
    },
    {
      id: "normalize",
      label: "normalize=True · shares",
      code: 'value_counts(normalize=True)',
      lines: L.at("normalize=True"),
      views: [
        {
          frame: SHARES,
          title: "value_counts(normalize=True)",
          series: true,
          highlights: { "*:0": "changed" },
          badge: "sums to 1.0",
          note: "0.5, 0.33, 0.17. Each count divided by the total — multiply by 100 yourself for percentages.",
        },
      ],
      explain:
        "Proportions are what you report, because counts mean nothing without the denominator: 3 free users is a different story out of 6 than out of 6,000. Note that normalize divides by the non-null count by default.",
    },
    {
      id: "dropna",
      label: "dropna=False · count the gaps",
      code: "value_counts(dropna=False)",
      lines: L.at("dropna=False"),
      views: [
        {
          frame: COUNTS,
          title: "value_counts()",
          muted: true,
          note: "value_counts silently excludes NaN by default, so the counts here would not add up to len(df) if any plan were missing.",
        },
      ],
      explain:
        "Always sanity-check value_counts().sum() against len(df). If they differ, the gap is missing values that the default quietly hid — and dropna=False brings NaN back as its own category so you can see how many.",
      outputs: [
        { label: "counts sum", value: "6" },
        { label: "len(df)", value: "6", tone: "success" },
      ],
    },
    {
      id: "unique",
      label: "unique · nunique · mode",
      code: 'df["plan"].unique()',
      lines: L.range('df["plan"].unique()', 'df["plan"].mode()'),
      views: [
        {
          frame: SIGNUPS,
          title: "df",
          muted: true,
          highlights: hlCol(SIGNUPS, "plan", "dim"),
        },
      ],
      outputs: [
        { label: "unique()", value: "['pro' 'free' 'max']", tone: "accent" },
        { label: "nunique()", value: "3" },
        { label: "mode()", value: "free", tone: "pink" },
      ],
      explain:
        "unique() preserves order of appearance and returns a NumPy array, not a Series — so it has no index and no .sort_values(). nunique() is the count, and mode() returns a Series, because a tie has several winners.",
    },
    {
      id: "crosstab",
      label: "crosstab · two columns at once",
      code: 'pd.crosstab(df["batch"], df["passed"])',
      lines: L.at("pd.crosstab"),
      views: [
        {
          frame: STUDENTS,
          title: "students",
          muted: true,
          highlights: {
            ...hlCol(STUDENTS, "batch", "group-a"),
            ...hlCol(STUDENTS, "passed", "group-b"),
          },
        },
        {
          frame: CROSS,
          title: 'pd.crosstab(batch, passed)',
          arrow: "one axis each, count the overlaps",
          badge: "contingency table",
          highlights: { "0:1": "new", "1:0": "changed" },
          note: "All 3 DSML students passed. SWE has 2 passes and 1 fail. Rows are the first argument, columns the second, and the cells are counts.",
        },
      ],
      explain:
        "crosstab turns two categorical columns into a matrix of co-occurrence counts. It is a pivot_table with aggfunc='count' and a friendlier signature — and normalize='index' converts each row to percentages, which is how you compare pass rates rather than raw numbers.",
    },
    {
      id: "tidy",
      label: "Back to a tidy frame",
      code: "value_counts().reset_index()",
      lines: L.at("reset_index()"),
      views: [
        {
          frame: TIDY,
          title: "value_counts().reset_index()",
          badge: "2 columns",
          highlights: { "*:0": "key" },
          note: "Two proper columns — plan and count — with a plain integer index. Now it can be merged, plotted or exported.",
        },
      ],
      explain:
        "value_counts returns a Series indexed by the values, which is perfect for reading and awkward for everything else. reset_index turns it into the two-column frame that merges and plotting libraries expect.",
    },
  ];

  return (
    <PageShell meta={PAGES.valuecounts}>
      <StepRunner runId="valuecounts" code={L.code} steps={steps} />
    </PageShell>
  );
}

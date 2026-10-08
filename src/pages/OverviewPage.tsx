import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  colNames,
  hlCol,
  hlRows,
  series,
  shapeOf,
  takeCols,
  takeRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`import pandas as pd

df = pd.DataFrame({
    "name":     ["Aarav", "Priya", "Ishaan", "Diya", "Kabir", "Zoya"],
    "batch":    ["DSML", "DSML", "SWE", "DSML", "SWE", "SWE"],
    "score":    [91, 88, 74, 95, 82, 68],
    "attempts": [2, 1, 3, 1, 2, 3],
    "passed":   [True, True, True, True, True, False],
})

df.shape        # (6, 5)  -> (rows, columns)
df.index        # RangeIndex(start=0, stop=6, step=1)
df.columns      # the column labels
df.dtypes       # one dtype per column

df["score"]     # one column      -> Series
df[["score"]]   # list of columns -> DataFrame
df.loc[1]       # one row         -> Series
df.mean(numeric_only=True)   # axis=0: down the rows`);

export function OverviewPage() {
  const rowAsSeries = series("1", STUDENTS.data[1], {
    index: colNames(STUDENTS),
  });

  const columnMeans = series("0", [83, 2], { index: ["score", "attempts"] });

  const steps: Step[] = [
    {
      id: "whole",
      label: "The whole table",
      code: "df",
      lines: L.range('pd.DataFrame({', '})'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          note: "Six students, five attributes. Small enough to check every number by hand — which is the point.",
        },
      ],
      outputs: [
        { label: "df.shape", value: "(6, 5)" },
        { label: "size", value: "30 values" },
      ],
      explain:
        "A DataFrame is one rectangular block of data plus two sets of labels: one for the rows (the index) and one for the columns. Those labels are what make pandas different from a plain 2-D array.",
      variables: [{ name: "df", type: "DataFrame", preview: shapeOf(STUDENTS) }],
    },
    {
      id: "index",
      label: "Part 1 · the index",
      code: "df.index",
      lines: L.at("df.index"),
      views: [
        {
          frame: STUDENTS,
          title: "df.index  ← the grey column on the left",
          highlights: hlRows([0, 1, 2, 3, 4, 5], "dim"),
          badge: "RangeIndex 0…5",
          note: "The index is not data. It is the row's name — a label pandas uses to find, align and join rows.",
        },
      ],
      explain:
        "By default the index is just 0, 1, 2, … But it can be anything: names, dates, IDs. Whatever it is, it sticks to its row through every filter, sort and join you perform.",
      variables: [
        { name: "df.index", type: "RangeIndex", preview: "0, 1, 2, 3, 4, 5" },
      ],
    },
    {
      id: "columns",
      label: "Part 2 · the columns",
      code: "df.columns",
      lines: L.at("df.columns"),
      views: [
        {
          frame: STUDENTS,
          title: "df.columns  ← the header band on top",
          badge: "5 labels",
          dtypes: true,
          note: "Each column carries one name and exactly one dtype for all of its values.",
        },
      ],
      explain:
        "Columns are labelled too, and each one is internally a single typed array. That is why a column of 10 million numbers adds that fast: the work happens in compiled code over one contiguous block of memory.",
      variables: [
        {
          name: "df.columns",
          type: "Index",
          preview: "name, batch, score, …",
        },
      ],
    },
    {
      id: "dtypes",
      label: "Part 3 · the dtypes",
      code: "df.dtypes",
      lines: L.at("df.dtypes"),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          dtypes: true,
          highlights: { ...hlCol(STUDENTS, "score", "match"), ...hlCol(STUDENTS, "attempts", "match") },
          note: "Numbers are int64, text is object, booleans are bool. The dtype decides which operations are even legal.",
        },
      ],
      stdout: `name        object
batch       object
score        int64
attempts     int64
passed        bool
dtype: object`,
      explain:
        "One dtype per column, never per cell. A column is a typed array, so a single stray string drags the whole column to object dtype — and silently disables arithmetic on it.",
    },
    {
      id: "one-col",
      label: "One column → Series",
      code: 'df["score"]',
      lines: L.at('df["score"]'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          muted: true,
          highlights: hlCol(STUDENTS, "score", "match"),
        },
        {
          frame: takeCols(STUDENTS, ["score"]),
          title: 'df["score"]',
          badge: "Series",
          series: true,
          arrow: "pull one column out",
          note: "The index came along for the ride. Values without their labels would just be a NumPy array.",
        },
      ],
      explain:
        "Selecting a single column with a string gives you a Series: the values plus the same index the DataFrame had. This is the object nearly every pandas method returns.",
      variables: [
        { name: 'df["score"]', type: "Series[int64]", preview: "6 values" },
      ],
    },
    {
      id: "two-cols",
      label: "A list of columns → DataFrame",
      code: 'df[["name", "score"]]',
      lines: L.at('df[["score"]]'),
      views: [
        {
          frame: takeCols(STUDENTS, ["name", "score"]),
          title: 'df[["name", "score"]]',
          badge: "DataFrame",
          note: "Double brackets = a list of labels = still a table. Even df[['score']] with one name gives a 6 × 1 DataFrame, not a Series.",
        },
      ],
      explain:
        "The number of brackets changes the type of the result. One string selects a column and flattens to 1-D; a list selects a sub-table and stays 2-D. This trips people up constantly.",
    },
    {
      id: "one-row",
      label: "One row → Series too",
      code: "df.loc[1]",
      lines: L.at("df.loc[1]"),
      views: [
        {
          frame: takeRows(STUDENTS, [1]),
          title: "the row at label 1",
          muted: true,
        },
        {
          frame: rowAsSeries,
          title: "df.loc[1]",
          badge: "Series",
          series: true,
          arrow: "rotate it 90°",
          note: "The column names became the index. Because the values are mixed types, the dtype falls back to object.",
        },
      ],
      explain:
        "A single row is also a Series — but turned on its side: the column names become its index. Mixing text and numbers in one Series forces dtype=object, which is why row-wise work is slower than column-wise work.",
    },
    {
      id: "axis",
      label: "axis=0 vs axis=1",
      code: "df.mean(numeric_only=True)",
      lines: L.at("df.mean(numeric_only=True)"),
      views: [
        {
          frame: columnMeans,
          title: "df.mean(numeric_only=True)",
          series: true,
          badge: "axis=0 (default)",
          note: "One value per column: the mean ran down the rows. axis=1 would instead run across each row.",
        },
      ],
      outputs: [
        { label: "score mean", value: "83.0" },
        { label: "attempts mean", value: "2.0" },
      ],
      explain:
        "axis=0 means 'move down the rows', collapsing each column to one number. axis=1 means 'move across the columns', collapsing each row. Read axis as 'the axis that disappears'.",
    },
  ];

  return (
    <PageShell meta={PAGES.overview}>
      <StepRunner runId="overview" code={L.code} steps={steps} />
    </PageShell>
  );
}

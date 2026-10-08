import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { RAW_CSV, STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import { df, hlRows, setIndex, shapeOf, takeRows } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`import pandas as pd

# 1 — dict of lists: each KEY becomes a column
df = pd.DataFrame({
    "name":  ["Aarav", "Priya"],
    "score": [91, 88],
})

# 2 — list of dicts: each DICT becomes a row
df = pd.DataFrame([
    {"name": "Aarav", "score": 91},
    {"name": "Priya", "score": 88},
])

# 3 — or read it from a file
df = pd.read_csv("students.csv")
df = pd.read_csv("students.csv", index_col="name")

# 4 — and write it back out
df.to_csv("clean.csv", index=False)`);

const TWO = df({ name: ["Aarav", "Priya"], score: [91, 88] });

export function CreatePage() {
  const steps: Step[] = [
    {
      id: "dict",
      label: "From a dict of lists",
      code: 'pd.DataFrame({"name": [...], "score": [...]})',
      lines: L.range("# 1 — dict of lists", "})"),
      views: [
        {
          frame: TWO,
          title: "df",
          dtypes: true,
          note: 'The dict keys — "name" and "score" — became the column headers. Each list became that column\'s values, top to bottom.',
        },
      ],
      explain:
        "This is the most common constructor. Read it as columns: one key per column, one list of values per key. Every list must be the same length or pandas raises.",
      variables: [{ name: "df", type: "DataFrame", preview: shapeOf(TWO) }],
    },
    {
      id: "records",
      label: "From a list of dicts",
      code: 'pd.DataFrame([{"name": "Aarav", ...}, ...])',
      lines: L.range("# 2 — list of dicts", "])"),
      views: [
        {
          frame: TWO,
          title: "df",
          badge: "same result",
          note: "Identical table, built row-wise. Each dict was one row, and the union of their keys became the columns.",
        },
      ],
      explain:
        "A list of dicts is the 'records' orientation — the shape JSON APIs return. Keys missing from one record become NaN rather than an error, so ragged data loads without a fight.",
    },
    {
      id: "raw",
      label: "What a CSV actually is",
      code: 'open("students.csv").read()',
      lines: L.at("# 3 — or read it from a file"),
      views: [
        {
          frame: TWO,
          title: "(still the old df)",
          muted: true,
        },
      ],
      stdout: RAW_CSV,
      explain:
        "Just text. The first line is the header, every later line is a row, and commas separate the fields. read_csv has to guess everything else: the delimiter, the dtypes, and which strings mean 'missing'.",
    },
    {
      id: "read",
      label: "read_csv infers the schema",
      code: 'pd.read_csv("students.csv")',
      lines: L.at('df = pd.read_csv("students.csv")'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          dtypes: true,
          badge: "6 rows × 5 columns",
          note: "Note what pandas worked out on its own: int64 for the numbers, bool for True/False, object for the text, and a fresh 0…5 index.",
        },
      ],
      outputs: [
        { label: "shape", value: "(6, 5)" },
        { label: "dtypes inferred", value: "4 kinds" },
      ],
      explain:
        "read_csv scans the file and picks a dtype per column. It is convenient and usually right — but it is a guess, so df.dtypes should be your very next command.",
      variables: [
        { name: "df", type: "DataFrame", preview: shapeOf(STUDENTS) },
      ],
    },
    {
      id: "index-col",
      label: "Pick the index while reading",
      code: 'pd.read_csv("students.csv", index_col="name")',
      lines: L.at('index_col="name"'),
      views: [
        {
          frame: setIndex(STUDENTS, "name"),
          title: "df",
          badge: "index = name",
          note: 'The name column moved out of the body and became the row labels, so df.loc["Diya"] now works like a dictionary lookup.',
        },
      ],
      explain:
        "index_col promotes a file column to the index during the read. Worth doing whenever a column is a natural key — an id, a date, a name — because lookups and joins both go through the index.",
    },
    {
      id: "write",
      label: "Writing it back out",
      code: 'df.to_csv("clean.csv", index=False)',
      lines: L.at('df.to_csv("clean.csv"'),
      views: [
        {
          frame: takeRows(STUDENTS, [0, 1, 2]),
          title: "first rows of what gets written",
          highlights: hlRows([0, 1, 2], "new"),
        },
      ],
      stdout: `name,batch,score,attempts,passed
Aarav,DSML,91,2,True
Priya,DSML,88,1,True
…`,
      explain:
        "index=False keeps the row labels out of the file. Without it you get an extra unnamed column, which turns into a junk 'Unnamed: 0' column the next time anyone reads that file.",
    },
  ];

  return (
    <PageShell meta={PAGES.create}>
      <StepRunner runId="create" code={L.code} steps={steps} />
    </PageShell>
  );
}

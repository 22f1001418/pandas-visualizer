import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  dropCols,
  renameCols,
  takeCols,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df["per_attempt"] = df["score"] / df["attempts"]   # one vectorised divide

df = df.assign(
    per_attempt=df["score"] / df["attempts"],
    passed_str=df["passed"].astype(str),
)

df.new_col = values          # does NOT create a column — sets an attribute

df = df.drop(columns=["attempts", "passed"])
df = df.rename(columns={"score": "marks", "name": "student"})
df.insert(0, "rank", [1, 3, 5, 2, 4, 6])`);

const scores = col(STUDENTS, "score") as number[];
const attempts = col(STUDENTS, "attempts") as number[];
const perAttempt = scores.map((s, i) => s / attempts[i]);

const WITH_RATIO = assign(STUDENTS, "per_attempt", perAttempt, "float64");
const WITH_TWO = assign(
  WITH_RATIO,
  "passed_str",
  (col(STUDENTS, "passed") as boolean[]).map((p) => (p ? "True" : "False")),
);
const DROPPED = dropCols(WITH_RATIO, ["attempts", "passed"]);
const RENAMED = renameCols(DROPPED, { score: "marks", name: "student" });
const INSERTED = {
  ...RENAMED,
  columns: [{ name: "rank", dtype: "int64" as const }, ...RENAMED.columns],
  data: RENAMED.data.map((row, i) => [[1, 3, 5, 2, 4, 6][i], ...row]),
};

export function ColumnsPage() {
  const steps: Step[] = [
    {
      id: "derive",
      label: "A derived column",
      code: 'df["per_attempt"] = df["score"] / df["attempts"]',
      lines: L.at('df["per_attempt"] = '),
      views: [
        { frame: STUDENTS, title: "df", muted: true },
        {
          frame: WITH_RATIO,
          title: "df",
          arrow: "score ÷ attempts, six rows at once",
          highlights: { "*:5": "new" },
          badge: "6th column appeared",
          note: "Assigning to a name that does not exist creates it, at the right-hand end. 91/2 = 45.5, 88/1 = 88.0, and so on down the column.",
        },
      ],
      explain:
        "Two columns in, one column out, and no loop anywhere. pandas hands both arrays to NumPy, which divides them element-wise in compiled code — the same work a Python loop would do, roughly a hundred times faster.",
      variables: [
        { name: "df.shape", type: "tuple", preview: "(6, 6)" },
      ],
    },
    {
      id: "assign",
      label: "assign · the chainable form",
      code: "df.assign(per_attempt=…, passed_str=…)",
      lines: L.range("df = df.assign(", ")"),
      views: [
        {
          frame: WITH_TWO,
          title: "df.assign(…)",
          highlights: { "*:5": "new", "*:6": "new" },
          badge: "two columns in one call",
          note: "assign returns a new frame rather than modifying this one, which is what lets it sit in the middle of a chain.",
        },
      ],
      explain:
        "Bracket assignment mutates; assign returns. That makes assign the one that composes: df.query('score > 80').assign(ratio=…).sort_values('ratio') reads top to bottom with no intermediate variables.",
    },
    {
      id: "trap",
      label: "The attribute trap",
      code: "df.per_attempt = values",
      lines: L.at("df.new_col = values"),
      views: [
        {
          frame: STUDENTS,
          title: "df  ·  unchanged",
          muted: true,
          badge: "still 5 columns",
          note: "No column was created. The values went onto the object as a plain Python attribute and will not appear in df.columns, in to_csv, or in anything else.",
        },
      ],
      stdout: `UserWarning: Pandas doesn't allow columns to be created via a new attribute name`,
      explain:
        "Reading a column as df.score works, so it is natural to assume writing does too. It does not. Attribute access is a read-only convenience; creation always needs brackets or assign.",
      outputs: [
        { label: 'df["x"] = v', value: "creates", tone: "success" },
        { label: "df.x = v", value: "does not", tone: "danger" },
      ],
    },
    {
      id: "drop",
      label: "drop · remove columns",
      code: 'df.drop(columns=["attempts", "passed"])',
      lines: L.at("df.drop(columns="),
      views: [
        {
          frame: DROPPED,
          title: "df.drop(columns=[…])",
          badge: "4 columns left",
          note: "columns= is not optional padding. drop defaults to axis=0, so df.drop(['attempts']) would look for ROWS with those labels and raise a KeyError.",
        },
      ],
      explain:
        "Dropping is cheaper than selecting when you want to keep most columns. Both are fine — but say which axis you mean, because the error message for getting it wrong talks about the index and sends you looking in the wrong place.",
    },
    {
      id: "rename",
      label: "rename · relabel",
      code: 'df.rename(columns={"score": "marks"})',
      lines: L.at("df.rename(columns="),
      views: [
        {
          frame: RENAMED,
          title: "df.rename(columns={…})",
          highlights: { "*:0": "changed", "*:1": "changed" },
          badge: "2 headers changed",
          note: "A dict of only what changes. Everything unnamed is left exactly as it was.",
        },
      ],
      explain:
        "Prefer this over df.columns = ['a','b','c',...]. Assigning a whole list means the names are matched by position, so one omission or reordering silently relabels every column after it — and the data looks perfectly fine afterwards.",
    },
    {
      id: "insert",
      label: "insert · at a position",
      code: 'df.insert(0, "rank", [...])',
      lines: L.at("df.insert(0"),
      views: [
        {
          frame: INSERTED,
          title: 'df.insert(0, "rank", …)',
          highlights: { "*:0": "new" },
          badge: "new first column",
          note: "insert mutates in place and returns None — one of the few pandas methods that still works that way.",
        },
      ],
      explain:
        "Bracket assignment always appends on the right. When column order matters — an id that belongs first, a key next to the column it describes — insert places it exactly, and takes the position as its first argument.",
    },
  ];

  return (
    <PageShell meta={PAGES.columns}>
      <StepRunner runId="columns" code={L.code} steps={steps} />
    </PageShell>
  );
}

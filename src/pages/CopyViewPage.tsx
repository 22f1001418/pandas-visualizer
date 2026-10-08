import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlCells,
  hlRows,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`# Goal: lift every score below 70 up to 70.

df[df["score"] < 70]["score"] = 70      # WRONG — chained indexing

df.loc[df["score"] < 70, "score"] = 70  # RIGHT — one call

sub = df[df["batch"] == "SWE"].copy()   # an independent table
sub["score"] = 100                      # safe: df is untouched

df = df.sort_values("score")            # prefer reassigning
df.sort_values("score", inplace=True)   # over inplace=`);

const failing = whereRows(STUDENTS, (r) => (r.score as number) < 70);
const fixedScores = (col(STUDENTS, "score") as number[]).map((s) =>
  s < 70 ? 70 : s,
);
const FIXED = assign(STUDENTS, "score", fixedScores, "int64");

const SWE = takeRows(
  STUDENTS,
  whereRows(STUDENTS, (r) => r.batch === "SWE"),
);
const SWE_100 = assign(
  SWE,
  "score",
  SWE.data.map(() => 100),
  "int64",
);

export function CopyViewPage() {
  const steps: Step[] = [
    {
      id: "goal",
      label: "The goal",
      code: 'df[df["score"] < 70]',
      lines: L.at("# Goal:"),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlCells(
            failing.map((i) => [i, 2] as [number, number]),
            "drop",
          ),
          badge: "one row below 70",
          note: "Zoya scored 68. We want to raise that single cell to 70 and leave everything else alone.",
        },
      ],
      explain:
        "A one-cell edit, conditional on a filter. It is the most ordinary task imaginable, and it is where nearly everyone meets SettingWithCopyWarning for the first time.",
    },
    {
      id: "wrong",
      label: "The attempt that fails",
      code: 'df[df["score"] < 70]["score"] = 70',
      lines: L.at('df[df["score"] < 70]["score"] = 70'),
      views: [
        {
          frame: STUDENTS,
          title: "df  ·  after the assignment",
          highlights: hlCells(
            failing.map((i) => [i, 2] as [number, number]),
            "drop",
          ),
          badge: "still 68",
          note: "No error was raised. The warning was printed, the code carried on, and the frame is unchanged.",
        },
      ],
      stdout: `SettingWithCopyWarning:
A value is trying to be set on a copy of a slice from a DataFrame.
Try using .loc[row_indexer, col_indexer] = value instead`,
      explain:
        "This is the worst kind of bug: it looks like it worked. If you do not read the warning, you carry on with data you believe you cleaned. Downstream numbers will be wrong with no further hint.",
      outputs: [{ label: "Zoya's score", value: "68 — unchanged", tone: "danger" }],
    },
    {
      id: "why",
      label: "Why it fails",
      code: "two operations, not one",
      lines: L.at('df[df["score"] < 70]["score"] = 70'),
      views: [
        {
          frame: STUDENTS,
          title: "1. df  ·  the original",
          muted: true,
          highlights: hlRows(failing, "match"),
        },
        {
          frame: takeRows(STUDENTS, failing),
          title: "2. df[mask]  ·  a NEW object",
          arrow: "the filter may hand back a copy",
          highlights: hlCells([[0, 2]], "changed"),
          badge: "the write lands here",
          note: "Then ['score'] = 70 writes into THIS table — which nothing holds a reference to. It is garbage-collected a moment later, and the original never hears about it.",
        },
      ],
      explain:
        "Read the expression left to right. df[mask] runs first and produces a second object. The assignment then targets that object, not df. Whether it is a view onto df or an independent copy is an implementation detail — which is precisely why pandas warns instead of guessing.",
    },
    {
      id: "right",
      label: "The fix: one .loc call",
      code: 'df.loc[df["score"] < 70, "score"] = 70',
      lines: L.at('df.loc[df["score"] < 70, "score"] = 70'),
      views: [
        {
          frame: FIXED,
          title: "df  ·  after the assignment",
          highlights: hlCells(
            failing.map((i) => [i, 2] as [number, number]),
            "new",
          ),
          badge: "68 → 70",
          note: "One call, both coordinates. pandas knows the row selector and the column selector together, so it can write straight into the original block.",
        },
      ],
      explain:
        "The rule is short: if you are assigning, put the rows and the columns inside a single .loc. No intermediate object is created, so there is nothing for the write to get lost in.",
      outputs: [{ label: "Zoya's score", value: "70 — changed", tone: "success" }],
      variables: [{ name: "df", type: "DataFrame", preview: "modified in place" }],
    },
    {
      id: "copy",
      label: "When you want a separate table",
      code: 'sub = df[df["batch"] == "SWE"].copy()',
      lines: L.range('sub = df[df["batch"] == "SWE"].copy()', 'sub["score"] = 100'),
      views: [
        {
          frame: SWE_100,
          title: "sub",
          highlights: { "*:2": "changed" },
          badge: "independent",
          note: "Every score in sub is 100 …",
        },
        {
          frame: FIXED,
          title: "df",
          arrow: "and df never moved",
          badge: "untouched",
          note: "… while df keeps its real values. That separation is what .copy() buys you.",
        },
      ],
      explain:
        "Sometimes a detached table is exactly what you want — a scratch copy to experiment on. Say so with .copy() and the warning disappears for good, because your intent is now explicit rather than inferred.",
    },
    {
      id: "inplace",
      label: "A word on inplace=",
      code: 'df.sort_values("score", inplace=True)',
      lines: L.range('df = df.sort_values("score")', 'df.sort_values("score", inplace=True)'),
      views: [
        {
          frame: FIXED,
          title: "df",
          muted: true,
          note: "Both forms give the same frame. Only one of them composes.",
        },
      ],
      explain:
        "inplace=True looks like it saves memory, but most implementations copy internally anyway and then rebind the result. It also breaks chaining and returns None — so df = df.sort_values(...).head(3) works while the inplace version cannot. pandas is deprecating it; prefer reassignment.",
      outputs: [
        { label: "df = df.op()", value: "chains", tone: "success" },
        { label: "inplace=True", value: "returns None", tone: "warning" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.copyview}>
      <StepRunner runId="copyview" code={L.code} steps={steps} />
    </PageShell>
  );
}

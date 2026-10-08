import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  col,
  hlCells,
  hlRows,
  resetIndex,
  series,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`mask = df["score"] > 85         # a boolean Series, one per row
df[mask]                        # keep the True rows

mask.sum()                      # how many matched

df[(df["score"] > 85) & (df["batch"] == "DSML")]   # AND
df[(df["score"] > 85) | (df["attempts"] == 3)]     # OR
df[~(df["batch"] == "SWE")]                        # NOT

df[df["score"] > 85 and df["batch"] == "DSML"]     # ValueError!

df[mask].reset_index(drop=True)  # renumber 0..n-1`);

const scores = col(STUDENTS, "score") as number[];
const batches = col(STUDENTS, "batch") as string[];
const attempts = col(STUDENTS, "attempts") as number[];

export function FilteringPage() {
  const mask = series("score > 85", scores.map((s) => s > 85));
  const high = whereRows(STUDENTS, (r) => (r.score as number) > 85);
  const andIdx = whereRows(
    STUDENTS,
    (r) => (r.score as number) > 85 && r.batch === "DSML",
  );
  const orIdx = whereRows(
    STUDENTS,
    (r) => (r.score as number) > 85 || r.attempts === 3,
  );
  const notIdx = whereRows(STUDENTS, (r) => r.batch !== "SWE");

  const maskHl = (pred: (i: number) => boolean) => ({
    ...hlRows(
      STUDENTS.data.map((_, i) => i).filter((i) => pred(i)),
      "mask-true",
    ),
    ...hlRows(
      STUDENTS.data.map((_, i) => i).filter((i) => !pred(i)),
      "mask-false",
    ),
  });

  const steps: Step[] = [
    {
      id: "condition",
      label: "Step 1 · build the mask",
      code: 'mask = df["score"] > 85',
      lines: L.at('mask = df["score"] > 85'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          muted: true,
          highlights: hlCells(
            scores.map((_, i) => [i, 2] as [number, number]),
            "match",
          ),
        },
        {
          frame: mask,
          title: "mask",
          series: true,
          dtypes: true,
          arrow: "ask the question once per row",
          highlights: {
            ...hlCells(
              high.map((i) => [i, 0] as [number, number]),
              "mask-true",
            ),
            ...hlCells(
              STUDENTS.data
                .map((_, i) => i)
                .filter((i) => !high.includes(i))
                .map((i) => [i, 0] as [number, number]),
              "mask-false",
            ),
          },
          note: "Six comparisons, six answers. Nothing has been filtered yet — this is just the list of verdicts, aligned to the same index.",
        },
      ],
      explain:
        "Filtering is two separate things, and seeing them apart is what makes the syntax click. First the condition builds a boolean Series the same length as the frame. That object is independent — you can store it, count it, invert it.",
      variables: [
        { name: "mask", type: "Series[bool]", preview: "T,T,F,T,F,F" },
      ],
    },
    {
      id: "apply",
      label: "Step 2 · apply it",
      code: "df[mask]",
      lines: L.at("df[mask]  "),
      views: [
        {
          frame: STUDENTS,
          title: "df  ·  with the mask laid over it",
          highlights: maskHl((i) => high.includes(i)),
          muted: true,
        },
        {
          frame: takeRows(STUDENTS, high),
          title: "df[mask]",
          arrow: "keep only the True rows",
          badge: "3 of 6 rows",
          note: "The False rows are gone. Look at the index: 0, 1, 3 — the surviving rows kept their original labels.",
        },
      ],
      explain:
        "Handing the mask back to df[...] keeps the rows where it is True and drops the rest. The index is deliberately left with holes: those gaps are a record of which original rows made it through.",
      outputs: [
        { label: "before", value: "6 rows" },
        { label: "after", value: "3 rows", tone: "success" },
      ],
    },
    {
      id: "count",
      label: "Counting matches",
      code: "mask.sum()",
      lines: L.at("mask.sum()"),
      views: [
        {
          frame: mask,
          title: "mask",
          series: true,
          highlights: hlCells(
            high.map((i) => [i, 0] as [number, number]),
            "mask-true",
          ),
          note: "True counts as 1 and False as 0, so summing a mask counts the matches. mask.mean() gives the share instead.",
        },
      ],
      outputs: [
        { label: "mask.sum()", value: "3", tone: "accent" },
        { label: "mask.mean()", value: "0.5", tone: "pink" },
        { label: "len(df[mask])", value: "3" },
      ],
      explain:
        "You rarely need to materialise the filtered frame just to count it. Summing the mask is cheaper and reads better — and mask.mean() hands you the proportion directly, which is often the number you actually wanted.",
    },
    {
      id: "and",
      label: "AND · both conditions",
      code: 'df[(df["score"] > 85) & (df["batch"] == "DSML")]',
      lines: L.at("& (df[\"batch\"]"),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: maskHl((i) => andIdx.includes(i)),
          muted: true,
        },
        {
          frame: takeRows(STUDENTS, andIdx),
          title: "result",
          arrow: "score > 85  AND  batch == DSML",
          badge: `${andIdx.length} rows`,
          note: "Diya and Aarav and Priya all score above 85, and all three are DSML — so all three survive. Ishaan scores too low; Kabir and Zoya are the wrong batch.",
        },
      ],
      explain:
        "& combines two masks element by element. Each condition is wrapped in its own parentheses — not optional decoration, but a requirement, because & binds more tightly than > does.",
    },
    {
      id: "or",
      label: "OR · either condition",
      code: 'df[(df["score"] > 85) | (df["attempts"] == 3)]',
      lines: L.at('| (df["attempts"]'),
      views: [
        {
          frame: takeRows(STUDENTS, orIdx),
          title: "result",
          highlights: hlRows(
            orIdx.map((_, i) => i),
            "mask-true",
          ),
          badge: `${orIdx.length} rows`,
          note: "A wider net: high scorers plus anyone on their third attempt. Ishaan and Zoya join on attempts alone.",
        },
      ],
      explain:
        "| is the element-wise OR. Note that the result is not simply the two filters concatenated — rows matching both conditions appear once, because you are combining the masks before selecting, not combining two selections.",
    },
    {
      id: "not",
      label: "NOT · invert the mask",
      code: 'df[~(df["batch"] == "SWE")]',
      lines: L.at("df[~(df"),
      views: [
        {
          frame: takeRows(STUDENTS, notIdx),
          title: "result",
          badge: `${notIdx.length} rows`,
          note: 'Equivalent to df[df["batch"] != "SWE"], but ~ works on any mask you have already built — including a complicated one.',
        },
      ],
      explain:
        "~ flips every value in a mask. It earns its place when the condition you have is easier to state positively than negatively: ~df['email'].str.contains('@test') beats restating the whole thing.",
    },
    {
      id: "trap",
      label: "The parentheses trap",
      code: 'df[df["score"] > 85 and df["batch"] == "DSML"]',
      lines: L.at("and df[\"batch\"]"),
      views: [{ frame: STUDENTS, title: "df", muted: true }],
      stdout: `ValueError: The truth value of a Series is ambiguous.
Use a.empty, a.bool(), a.item(), a.any() or a.all().`,
      explain:
        "Python's `and` asks each side for a single True or False. A six-element Series cannot answer that, so it raises. Use & for element-wise logic — and keep each condition parenthesised.",
    },
    {
      id: "reset",
      label: "Renumbering afterwards",
      code: "df[mask].reset_index(drop=True)",
      lines: L.at("reset_index(drop=True)"),
      views: [
        {
          frame: resetIndex(takeRows(STUDENTS, high)),
          title: "df[mask].reset_index(drop=True)",
          badge: "index 0,1,2",
          note: "Clean 0,1,2 labels. drop=True throws the old index away; without it, the old labels are kept as a new column.",
        },
      ],
      explain:
        "Only do this when the holes in the index are a nuisance — when you are about to concat, or export, or use positional access. If you may need to trace a row back to its source, the gaps are information worth keeping.",
    },
  ];

  return (
    <PageShell meta={PAGES.filtering}>
      <StepRunner runId="filtering" code={L.code} steps={steps} />
    </PageShell>
  );
}

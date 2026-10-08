import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlRows,
  series,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df[df["batch"].isin(["DSML", "MLOps"])]      # membership
df[~df["batch"].isin(["SWE"])]               # "not in"

df[df["score"].between(80, 90)]              # inclusive range

df.query("score > 85")                       # the whole filter as a string
df.query("score > 85 and batch == 'DSML'")   # and / or as words

cutoff = 85
df.query("score > @cutoff")                  # @ reaches into Python

df.query("score > 85").eval("bonus = score * 0.1")`);

const batches = col(STUDENTS, "batch") as string[];

export function QueryPage() {
  const inIdx = whereRows(STUDENTS, (r) => ["DSML", "MLOps"].includes(r.batch as string));
  const notIdx = whereRows(STUDENTS, (r) => r.batch !== "SWE");
  const betweenIdx = whereRows(
    STUDENTS,
    (r) => (r.score as number) >= 80 && (r.score as number) <= 90,
  );
  const qIdx = whereRows(STUDENTS, (r) => (r.score as number) > 85);
  const q2Idx = whereRows(
    STUDENTS,
    (r) => (r.score as number) > 85 && r.batch === "DSML",
  );

  const isinMask = series(
    'batch.isin(["DSML","MLOps"])',
    batches.map((b) => ["DSML", "MLOps"].includes(b)),
  );

  // eval("bonus = score * 0.1") really does add the column, so compute it.
  const q2Frame = takeRows(STUDENTS, q2Idx);
  const withBonus = assign(
    q2Frame,
    "bonus",
    (col(q2Frame, "score") as number[]).map((s) => Math.round(s * 10) / 100),
    "float64",
  );

  const steps: Step[] = [
    {
      id: "isin",
      label: "isin · membership",
      code: 'df["batch"].isin(["DSML", "MLOps"])',
      lines: L.at('df["batch"].isin(["DSML", "MLOps"])'),
      views: [
        {
          frame: isinMask,
          title: 'df["batch"].isin([...])',
          series: true,
          dtypes: true,
          highlights: {
            ...hlRows(inIdx, "mask-true"),
            ...hlRows(
              STUDENTS.data.map((_, i) => i).filter((i) => !inIdx.includes(i)),
              "mask-false",
            ),
          },
          note: 'A plain boolean mask, same as any comparison. "MLOps" matches nothing here, and that is fine — isin does not require the values to exist.',
        },
        {
          frame: takeRows(STUDENTS, inIdx),
          title: "df[mask]",
          arrow: "one call instead of three ORs",
          badge: `${inIdx.length} rows`,
        },
      ],
      explain:
        "isin replaces a chain of ORs. Three categories would need (b=='A') | (b=='B') | (b=='C'); isin takes the list directly, and the list can come from a variable, another column, or a query result.",
    },
    {
      id: "notin",
      label: "~isin · not in",
      code: 'df[~df["batch"].isin(["SWE"])]',
      lines: L.at('df[~df["batch"].isin(["SWE"])]'),
      views: [
        {
          frame: takeRows(STUDENTS, notIdx),
          title: "result",
          badge: `${notIdx.length} rows`,
          note: "pandas has no notin method — you invert isin with ~. This is the standard way to express an exclusion list.",
        },
      ],
      explain:
        "Exclusion lists are everywhere in real work: drop the test accounts, drop the internal domains, drop the known-bad ids. ~isin(bad_list) is the idiom to reach for.",
    },
    {
      id: "between",
      label: "between · a range",
      code: 'df["score"].between(80, 90)',
      lines: L.at('df["score"].between(80, 90)'),
      views: [
        {
          frame: takeRows(STUDENTS, betweenIdx),
          title: 'df[df["score"].between(80, 90)]',
          badge: `${betweenIdx.length} rows`,
          note: "Inclusive at both ends by default: 88 and 82 are in, 91 and 95 are out. Pass inclusive='neither' to make both ends exclusive.",
        },
      ],
      explain:
        "between(80, 90) is shorthand for (s >= 80) & (s <= 90) — one call, no parentheses to get wrong. Easy to misread though, so say the bounds out loud: is 90 meant to be included?",
      outputs: [
        { label: "inclusive='both'", value: "default", tone: "accent" },
        { label: "matched", value: `${betweenIdx.length} rows` },
      ],
    },
    {
      id: "query",
      label: "query · the filter as a string",
      code: 'df.query("score > 85")',
      lines: L.at('df.query("score > 85")  '),
      views: [
        {
          frame: takeRows(STUDENTS, qIdx),
          title: 'df.query("score > 85")',
          badge: `${qIdx.length} rows`,
          note: "No df[...] repetition, no quotes around the column name, no brackets. Column names are bare identifiers inside the string.",
        },
      ],
      explain:
        "query parses the string and resolves the names against your columns. For a long filter it is dramatically more readable — compare df[(df.a > 1) & (df.b < 2)] with df.query('a > 1 and b < 2').",
    },
    {
      id: "query-and",
      label: "query · and / or as words",
      code: "df.query(\"score > 85 and batch == 'DSML'\")",
      lines: L.at("and batch == 'DSML'"),
      views: [
        {
          frame: takeRows(STUDENTS, q2Idx),
          title: "result",
          badge: `${q2Idx.length} rows`,
          highlights: hlRows(
            q2Idx.map((_, i) => i),
            "mask-true",
          ),
          note: "Inside query, `and` works — and so do `or` and `not`. The ambiguous-truth-value error cannot happen here, because this string is not Python.",
        },
      ],
      explain:
        "query's expression language is deliberately SQL-flavoured. Note the quoting: the outer string is double-quoted, so the string literal inside is single-quoted. Getting that backwards is the usual first mistake.",
    },
    {
      id: "var",
      label: "@ reaches into Python",
      code: 'cutoff = 85; df.query("score > @cutoff")',
      lines: L.at("@cutoff"),
      views: [
        {
          frame: takeRows(STUDENTS, qIdx),
          title: 'df.query("score > @cutoff")',
          badge: "cutoff = 85",
          note: "Without the @, query would look for a column named cutoff and raise UndefinedVariableError.",
        },
      ],
      explain:
        "The @ prefix is how a query string talks to the surrounding code — thresholds from a config, a list of ids from a previous cell. Backticks do the same job for awkward column names: `total sales`.",
      variables: [{ name: "cutoff", type: "int", preview: "85" }],
    },
    {
      id: "eval",
      label: "eval · compute in the same style",
      code: 'df.eval("bonus = score * 0.1")',
      lines: L.at("eval("),
      views: [
        {
          frame: withBonus,
          title: 'df.query("score > 85").eval("bonus = score * 0.1")',
          badge: "bonus = score × 0.1",
          highlights: { "*:5": "new" },
          note: "eval is query's sibling for arithmetic: it adds a column from an expression over the existing ones.",
        },
      ],
      explain:
        "Both methods exist for the same reason — keeping long chains readable, and letting pandas evaluate big expressions without building every intermediate array. On small frames the plain mask is faster; use these for clarity, not speed.",
    },
  ];

  return (
    <PageShell meta={PAGES.query}>
      <StepRunner runId="query" code={L.code} steps={steps} />
    </PageShell>
  );
}

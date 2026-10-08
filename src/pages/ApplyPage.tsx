import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import { assign, col, hlCol, takeCols } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df["grade"] = df["score"].apply(
    lambda s: "A" if s >= 90 else "B" if s >= 80 else "C"
)

df["batch_full"] = df["batch"].map({"DSML": "Data Science", "SWE": "Software"})

df["adjusted"] = df.apply(
    lambda row: row["score"] - 5 * (row["attempts"] - 1),
    axis=1,
)

df["grade"] = np.where(df["score"] >= 90, "A", "B")       # vectorised

df["band"] = pd.cut(df["score"], bins=[0, 75, 85, 100],
                    labels=["low", "mid", "high"])`);

const scores = col(STUDENTS, "score") as number[];
const attempts = col(STUDENTS, "attempts") as number[];
const batches = col(STUDENTS, "batch") as string[];

const grades = scores.map((s) => (s >= 90 ? "A" : s >= 80 ? "B" : "C"));
const full = batches.map((b) =>
  b === "DSML" ? "Data Science" : "Software",
);
const adjusted = scores.map((s, i) => s - 5 * (attempts[i] - 1));
const bands = scores.map((s) => (s <= 75 ? "low" : s <= 85 ? "mid" : "high"));

const BASE = takeCols(STUDENTS, ["name", "batch", "score", "attempts"]);
const WITH_GRADE = assign(BASE, "grade", grades);
const WITH_FULL = assign(WITH_GRADE, "batch_full", full);
const WITH_ADJ = assign(WITH_GRADE, "adjusted", adjusted, "int64");
const WITH_BAND = assign(WITH_GRADE, "band", bands, "category");

export function ApplyPage() {
  const steps: Step[] = [
    {
      id: "apply",
      label: "apply · once per value",
      code: 'df["score"].apply(lambda s: …)',
      lines: L.range('df["grade"] = df["score"].apply(', ")"),
      views: [
        {
          frame: WITH_GRADE,
          title: "df",
          highlights: { "*:4": "new" },
          badge: "grade added",
          note: "The lambda ran six times, once per score, and the six return values became the new column. 91 → A, 88 → B, 74 → C.",
        },
      ],
      explain:
        "Series.apply hands each value to your function and collects the answers. The function is ordinary Python — if/else, string work, a dictionary lookup, a call into another library. That freedom is the point.",
      variables: [
        { name: "calls to lambda", type: "int", preview: "6" },
      ],
    },
    {
      id: "map",
      label: "map · with a dict",
      code: 'df["batch"].map({"DSML": "Data Science", …})',
      lines: L.at('df["batch"].map('),
      views: [
        {
          frame: WITH_FULL,
          title: "df",
          highlights: { "*:5": "new" },
          badge: "recoded",
          note: "No function needed — a dict is enough. Any value not in the dict becomes NaN, which doubles as a check that you covered every category.",
        },
      ],
      explain:
        "map is the cleanest way to recode a categorical column: country codes to names, status ids to labels, abbreviations to full text. Build the dict once, apply it anywhere, and get NaN wherever reality surprised you.",
    },
    {
      id: "row",
      label: "apply(axis=1) · once per row",
      code: "df.apply(lambda row: …, axis=1)",
      lines: L.range('df["adjusted"] = df.apply(', "axis=1,"),
      views: [
        {
          frame: WITH_ADJ,
          title: "df",
          highlights: { "*:5": "new" },
          badge: "penalty applied",
          note: "Five marks off per retake: Aarav 91 − 5 = 86, Ishaan 74 − 10 = 64, Diya keeps 95 on her first attempt.",
        },
      ],
      explain:
        "With axis=1 the function receives each row as a Series, so row['score'] and row['attempts'] are both available. This is the escape hatch for logic spanning several columns — and the slowest thing in pandas, because every row is built as an object first.",
      outputs: [
        { label: "rows processed", value: "6" },
        { label: "Series built", value: "6", tone: "warning" },
      ],
    },
    {
      id: "where",
      label: "np.where · the vectorised if",
      code: 'np.where(df["score"] >= 90, "A", "B")',
      lines: L.at("np.where"),
      views: [
        {
          frame: WITH_GRADE,
          title: "df",
          highlights: hlCol(WITH_GRADE, "grade", "changed"),
          badge: "same answer, no Python loop",
          note: "np.where(condition, value_if_true, value_if_false) — the whole column decided in one compiled pass. Nest them, or use np.select, for more than two outcomes.",
        },
      ],
      explain:
        "Whenever an apply is really just an if/else, this replaces it. On six rows you cannot tell the difference; on a few million, apply takes seconds and np.where takes milliseconds. Reach for the vectorised form first and keep apply for genuinely irregular logic.",
      outputs: [
        { label: "apply, 1M rows", value: "~1.2 s", tone: "warning" },
        { label: "np.where, 1M rows", value: "~12 ms", tone: "success" },
      ],
    },
    {
      id: "cut",
      label: "pd.cut · vectorised bucketing",
      code: 'pd.cut(df["score"], bins=[0, 75, 85, 100], labels=[…])',
      lines: L.range('df["band"] = pd.cut(', 'labels=["low", "mid", "high"])'),
      views: [
        {
          frame: WITH_BAND,
          title: "df",
          dtypes: true,
          highlights: { "*:5": "new" },
          badge: "3 bands",
          note: "Bins are (0,75], (75,85], (85,100] — left-open, right-closed. 74 is low, 82 is mid, 91 is high. The result is a proper ordered category.",
        },
      ],
      explain:
        "Bucketing a number into bands is so common it has its own function, and cut does it better than an apply would: the output is an ordered categorical, so it sorts correctly and groups efficiently. qcut does the same by quantile instead of by fixed edges.",
    },
  ];

  return (
    <PageShell meta={PAGES.apply}>
      <StepRunner runId="apply" code={L.code} steps={steps} />
    </PageShell>
  );
}

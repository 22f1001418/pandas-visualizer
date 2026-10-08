import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS, STUDENTS_WITH_NA } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  argsortBy,
  assign,
  col,
  hlByGroup,
  hlCol,
  series,
  sortValues,
  takeRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.sort_values("score")                   # ascending by default
df.sort_values("score", ascending=False)  # highest first

df.sort_values(["batch", "score"], ascending=[True, False])

df.sort_values("score", na_position="first")   # NaN normally sinks

df["rank"] = df["score"].rank(ascending=False)
df["rank"] = df["score"].rank(method="dense", ascending=False)

df.nlargest(3, "score")      # one pass, no full sort

df.sort_values("score")      # returns a NEW frame — reassign it!`);

const scores = col(STUDENTS, "score") as number[];

export function SortingPage() {
  const asc = sortValues(STUDENTS, "score");
  const desc = sortValues(STUDENTS, "score", false);
  const multi = sortValues(STUDENTS, ["batch", "score"], [true, false]);
  const naFirst = sortValues(STUDENTS_WITH_NA, "score");

  // rank(ascending=False): 95→1, 91→2, 88→3, 82→4, 74→5, 68→6
  const ranks = scores.map(
    (s) => scores.filter((o) => o > s).length + 1,
  );
  const WITH_RANK = assign(STUDENTS, "rank", ranks, "float64");
  const top3 = argsortBy(STUDENTS, ["score"], false).slice(0, 3);

  const steps: Step[] = [
    {
      id: "asc",
      label: "sort_values · ascending",
      code: 'df.sort_values("score")',
      lines: L.at('df.sort_values("score")  '),
      views: [
        { frame: STUDENTS, title: "df", muted: true },
        {
          frame: asc,
          title: 'df.sort_values("score")',
          arrow: "lowest score first",
          highlights: hlCol(STUDENTS, "score", "match"),
          badge: "68 → 95",
          note: "Watch the index column: 5, 2, 4, 1, 0, 3. The labels travelled with their rows rather than being renumbered.",
        },
      ],
      explain:
        "Sorting rearranges rows; it does not relabel them. That is the single most important thing to notice here, because it is what makes .loc and .iloc disagree afterwards.",
    },
    {
      id: "desc",
      label: "ascending=False",
      code: 'df.sort_values("score", ascending=False)',
      lines: L.at("ascending=False)  "),
      views: [
        {
          frame: desc,
          title: "highest first",
          badge: "95 → 68",
          highlights: { "0:*": "match" },
          note: "Diya at the top with 95. Exactly the reverse of the previous step.",
        },
      ],
      explain:
        "Descending is the usual direction for a leaderboard, a top-spend report, a biggest-error list. One keyword, and worth saying explicitly even when you think the default is right.",
    },
    {
      id: "multi",
      label: "Multi-column, mixed directions",
      code: 'df.sort_values(["batch", "score"], ascending=[True, False])',
      lines: L.at('["batch", "score"]'),
      views: [
        {
          frame: multi,
          title: "sorted by batch, then score desc",
          highlights: hlByGroup(multi, "batch"),
          badge: "hierarchical",
          note: "DSML first (alphabetical), and within DSML: 95, 91, 88. Then SWE: 82, 74, 68. The second key only breaks ties in the first.",
        },
      ],
      explain:
        "The booleans line up with the column list positionally, so you can sort one key up and another down. This is how you build grouped reports — category ascending for readability, value descending for ranking.",
    },
    {
      id: "na",
      label: "Where NaN goes",
      code: 'df.sort_values("score", na_position="first")',
      lines: L.at('na_position="first"'),
      views: [
        {
          frame: naFirst,
          title: 'sort_values("score")',
          highlights: hlCol(STUDENTS_WITH_NA, "score", "null"),
          badge: "NaN sinks by default",
          note: "Missing scores go to the bottom in both directions — NaN is unorderable, so it is placed rather than compared. na_position='first' moves it to the top.",
        },
      ],
      explain:
        "Useful as a diagnostic: sorting with na_position='first' puts your data-quality problems on the first screen rather than hiding them on the last page of output.",
    },
    {
      id: "rank",
      label: "rank · order as a number",
      code: 'df["score"].rank(ascending=False)',
      lines: L.at('rank(ascending=False)'),
      views: [
        {
          frame: WITH_RANK,
          title: 'df["rank"]',
          highlights: { "*:5": "new" },
          badge: "1 = best",
          note: "Diya is 1, Aarav 2, Priya 3. The rows did not move — rank adds the ordering as data, which is what you want when the position must survive a later re-sort.",
        },
      ],
      explain:
        "rank answers 'where does this row stand' without reordering anything. Its method= argument decides how ties behave: 'average' (the default, giving 2.5 to two tied runners-up), 'min', or 'dense' for 1,2,3 with no gaps.",
      outputs: [
        { label: "method='average'", value: "ties → 2.5" },
        { label: "method='dense'", value: "no gaps" },
      ],
    },
    {
      id: "nlargest",
      label: "nlargest · skip the sort",
      code: 'df.nlargest(3, "score")',
      lines: L.at("df.nlargest(3"),
      views: [
        {
          frame: takeRows(STUDENTS, top3),
          title: 'df.nlargest(3, "score")',
          highlights: hlCol(STUDENTS, "score", "match"),
          badge: "top 3",
          note: "Same result as sort_values(ascending=False).head(3), but pandas only tracks the three largest instead of ordering all six.",
        },
      ],
      explain:
        "On six rows this is a stylistic choice. On ten million it is the difference between an O(n log n) sort and a single O(n) pass — and the intent reads better too.",
    },
    {
      id: "reassign",
      label: "Remember to reassign",
      code: 'df.sort_values("score")   # result thrown away',
      lines: L.at("# returns a NEW frame"),
      views: [
        {
          frame: STUDENTS,
          title: "df  ·  after the call",
          muted: true,
          badge: "unsorted",
          note: "The sorted frame was created, returned, and immediately discarded because nothing caught it.",
        },
      ],
      explain:
        "Almost every pandas method returns a new object rather than editing yours. A bare df.sort_values('score') on its own line is a no-op — valid Python, silently useless. Write df = df.sort_values('score').",
      outputs: [
        { label: "df.sort_values(…)", value: "no effect", tone: "danger" },
        { label: "df = df.sort_values(…)", value: "works", tone: "success" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.sorting}>
      <StepRunner runId="sorting" code={L.code} steps={steps} />
    </PageShell>
  );
}

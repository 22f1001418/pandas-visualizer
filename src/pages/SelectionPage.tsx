import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { STUDENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  colNames,
  hlCells,
  hlCol,
  hlRows,
  series,
  setIndex,
  sortValues,
  takeCols,
  takeRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.loc[1]                       # one row, by LABEL
df.loc[1:3]                     # labels 1,2,3 — both ends INCLUSIVE
df.iloc[1:3]                    # positions 1,2 — end EXCLUSIVE

df.loc[:, "name":"score"]       # column slice, by label
df.iloc[0:3, 0:2]               # rows and columns, by position

df.loc[df["score"] > 85, ["name", "score"]]   # mask + columns

df.sort_values("score").iloc[0] # "the first row" after sorting
df.sort_values("score").loc[0]  # still the row labelled 0

df.at[1, "score"]               # single cell, fastest path`);

export function SelectionPage() {
  const rowAsSeries = series("1", STUDENTS.data[1], {
    index: colNames(STUDENTS),
  });
  const sorted = sortValues(STUDENTS, "score");

  const steps: Step[] = [
    {
      id: "loc-row",
      label: "loc[1] · one row by label",
      code: "df.loc[1]",
      lines: L.at("df.loc[1]  "),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          muted: true,
          highlights: hlRows([1], "match"),
        },
        {
          frame: rowAsSeries,
          title: "df.loc[1]",
          series: true,
          arrow: "one row → a Series",
          badge: "Series",
          note: "A single label on the row axis collapses the result to 1-D, with the column names as its index.",
        },
      ],
      explain:
        "Think of .loc as a dictionary lookup on the row labels. Here the label 1 happens to sit at position 1 — on a fresh frame labels and positions agree, which is exactly why the two accessors get confused.",
    },
    {
      id: "loc-slice",
      label: "loc[1:3] · inclusive",
      code: "df.loc[1:3]",
      lines: L.at("df.loc[1:3]"),
      views: [
        {
          frame: takeRows(STUDENTS, [1, 2, 3]),
          title: "df.loc[1:3]",
          highlights: hlRows([0, 1, 2], "match"),
          badge: "3 rows",
          note: "Labels 1, 2 AND 3. Unlike every other slice in Python, .loc includes the right-hand end.",
        },
      ],
      explain:
        "Label slices are inclusive at both ends, because pandas cannot know what comes 'just before' an arbitrary label — with a date or string index there is no next value to stop at. So it stops on the label you named.",
      outputs: [{ label: "rows returned", value: "3", tone: "accent" }],
    },
    {
      id: "iloc-slice",
      label: "iloc[1:3] · exclusive",
      code: "df.iloc[1:3]",
      lines: L.at("df.iloc[1:3]"),
      views: [
        {
          frame: takeRows(STUDENTS, [1, 2]),
          title: "df.iloc[1:3]",
          highlights: hlRows([0, 1], "changed"),
          badge: "2 rows",
          note: "Positions 1 and 2. The 3 is a stop marker, not a row — ordinary Python slicing.",
        },
      ],
      explain:
        "Same numbers, one fewer row. .iloc is positional, so it follows list rules: the end is excluded. Side by side with the previous step, this is the whole .loc/.iloc distinction in one picture.",
      outputs: [
        { label: "loc[1:3]", value: "3 rows" },
        { label: "iloc[1:3]", value: "2 rows", tone: "pink" },
      ],
    },
    {
      id: "col-slice",
      label: "Slicing columns too",
      code: 'df.loc[:, "name":"score"]',
      lines: L.at('df.loc[:, "name":"score"]'),
      views: [
        {
          frame: takeCols(STUDENTS, ["name", "batch", "score"]),
          title: 'df.loc[:, "name":"score"]',
          badge: "all rows, 3 columns",
          note: "The bare colon means 'every row'. The column slice is inclusive as well, so score is kept.",
        },
      ],
      explain:
        "Both accessors take two arguments: rows first, then columns. You can slice, list or mask either side independently — which makes .loc a complete replacement for the overloaded plain [].",
    },
    {
      id: "iloc-2d",
      label: "iloc on both axes",
      code: "df.iloc[0:3, 0:2]",
      lines: L.at("df.iloc[0:3, 0:2]"),
      views: [
        {
          frame: takeCols(takeRows(STUDENTS, [0, 1, 2]), ["name", "batch"]),
          title: "df.iloc[0:3, 0:2]",
          badge: "3 × 2 block",
          note: "Pure coordinates: the first three rows, the first two columns. No labels involved anywhere.",
        },
      ],
      explain:
        "This is the NumPy way of reading a frame, and it is the right choice when position genuinely is what you mean — 'the first row of each file', 'the last column'.",
    },
    {
      id: "mask-cols",
      label: "Mask + column list",
      code: 'df.loc[df["score"] > 85, ["name", "score"]]',
      lines: L.at('df.loc[df["score"] > 85'),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          muted: true,
          highlights: {
            ...hlRows([0, 1, 3], "match"),
            ...hlRows([2, 4, 5], "mask-false"),
          },
        },
        {
          frame: takeCols(takeRows(STUDENTS, [0, 1, 3]), ["name", "score"]),
          title: "result",
          arrow: "rows by condition, columns by name",
          badge: "3 × 2",
          note: "Index labels 0, 1 and 3 survived. The gap at 2 tells you Ishaan was filtered out.",
        },
      ],
      explain:
        "The real reason to learn .loc: it takes a boolean mask on the rows and a column list on the columns in one call. That single expression replaces a filter followed by a projection — and avoids the copy-vs-view trap entirely.",
    },
    {
      id: "after-sort",
      label: "After sorting, they diverge",
      code: "df.sort_values('score').iloc[0]  vs  .loc[0]",
      lines: L.at("df.sort_values(\"score\").iloc[0]", "df.sort_values(\"score\").loc[0]"),
      views: [
        {
          frame: sorted,
          title: 'df.sort_values("score")',
          highlights: {
            ...hlCells([[0, 0], [0, 2]], "changed"),
            ...hlCells([[5, 0], [5, 2]], "match"),
          },
          badge: "sorted by score",
          note: "iloc[0] is now Zoya (pink, lowest score). loc[0] is still Aarav (blue, label 0) — now sitting at the bottom.",
        },
      ],
      explain:
        "Here is where the distinction stops being academic. Sorting moves rows but keeps their labels, so 'position 0' and 'label 0' are now different students. Ask yourself which one you mean — the answer is usually position.",
      outputs: [
        { label: ".iloc[0].name", value: "Zoya", tone: "pink" },
        { label: ".loc[0].name", value: "Aarav", tone: "accent" },
      ],
    },
    {
      id: "at",
      label: "at · a single cell",
      code: 'df.at[1, "score"]',
      lines: L.at("df.at[1"),
      views: [
        {
          frame: STUDENTS,
          title: "df",
          highlights: hlCells([[1, 2]], "key"),
          badge: "one scalar",
          note: "One label, one column, one value. .iat is the positional twin: df.iat[1, 2].",
        },
      ],
      outputs: [{ label: 'df.at[1, "score"]', value: "88", tone: "accent" }],
      explain:
        ".at skips all of the slicing machinery and goes straight to the cell, which makes it several times faster than .loc for single values. Reach for it when you are reading cells inside a loop.",
    },
    {
      id: "named-index",
      label: "The same, with real labels",
      code: 'df.set_index("name").loc["Diya"]',
      lines: L.at("df.loc[1]  "),
      views: [
        {
          frame: setIndex(STUDENTS, "name"),
          title: 'df.set_index("name")',
          highlights: hlRows([3], "key"),
          badge: 'index = name',
          note: 'Now df.loc["Diya"] reads like what it means, and it keeps working no matter how the rows get reordered.',
        },
      ],
      explain:
        "With a meaningful index, .loc stops being a numbers game. This is the argument for setting an index early: label-based access survives sorting, filtering and merging, while positions do not.",
    },
  ];

  return (
    <PageShell meta={PAGES.selection}>
      <StepRunner runId="selection" code={L.code} steps={steps} />
    </PageShell>
  );
}

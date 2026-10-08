import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { SIGNUPS } from "@/data/samples";
import { listing } from "@/lib/code";
import { hlRows, resetIndex, series, takeRows } from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.duplicated()                       # True for every repeat after the first
df.duplicated().sum()                 # how many rows would go

df.drop_duplicates()                  # keep the first of each group
df.drop_duplicates(subset=["user_id"])        # one row per user
df.drop_duplicates(subset=["user_id"], keep="last")   # keep the newest
df.drop_duplicates(keep=False)        # keep only rows that were never repeated

df["user_id"].nunique()               # 3 distinct users`);

const F = SIGNUPS;

/** Signature of each row, so duplicate detection matches pandas exactly. */
const sig = (r: number, cols = F.columns.map((c) => c.name)) =>
  cols.map((c) => String(F.data[r][F.columns.findIndex((x) => x.name === c)])).join("|");

const dupFlags = F.data.map((_, r) => {
  const s = sig(r);
  return F.data.slice(0, r).some((_, prev) => sig(prev) === s);
});

const firstIdx = F.data.map((_, r) => r).filter((r) => !dupFlags[r]);

const byUserFirst = (() => {
  const seen = new Set<string>();
  return F.data
    .map((_, r) => r)
    .filter((r) => {
      const k = sig(r, ["user_id"]);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
})();

const byUserLast = (() => {
  const lastOf = new Map<string, number>();
  F.data.forEach((_, r) => lastOf.set(sig(r, ["user_id"]), r));
  return [...lastOf.values()].sort((a, b) => a - b);
})();

const neverRepeated = F.data
  .map((_, r) => r)
  .filter((r) => !F.data.some((_, o) => o !== r && sig(o) === sig(r)));

export function DuplicatesPage() {
  const flagSeries = series("duplicated()", dupFlags);

  const steps: Step[] = [
    {
      id: "look",
      label: "A table appended twice",
      code: "df",
      lines: L.at("df.duplicated()  "),
      views: [
        {
          frame: F,
          title: "df",
          badge: "6 rows",
          note: "Rows 0 and 2 are identical, and so are rows 1 and 4. Row 5 is user 1 again — but on a different plan and date, so it is a genuinely new record.",
        },
      ],
      explain:
        "The shape of real duplication: an ETL job ran twice and re-inserted some rows verbatim, while legitimate repeat activity from the same user also exists. Telling those two apart is the whole problem.",
      variables: [{ name: "len(df)", type: "int", preview: "6" }],
    },
    {
      id: "flag",
      label: "duplicated() · flag the repeats",
      code: "df.duplicated()",
      lines: L.at("df.duplicated()  "),
      views: [
        {
          frame: F,
          title: "df",
          muted: true,
          highlights: hlRows(
            F.data.map((_, r) => r).filter((r) => dupFlags[r]),
            "drop",
          ),
        },
        {
          frame: flagSeries,
          title: "df.duplicated()",
          series: true,
          arrow: "have I seen this exact row before?",
          highlights: {
            ...hlRows(
              F.data.map((_, r) => r).filter((r) => dupFlags[r]),
              "mask-true",
            ),
            ...hlRows(firstIdx, "mask-false"),
          },
          note: "Only rows 2 and 4 are flagged. The first occurrence of each pair is False — it is the copy that gets flagged, not the original.",
        },
      ],
      explain:
        "duplicated() compares the whole row against everything above it. Because only later copies are marked, the flag count is exactly the number of rows drop_duplicates would remove.",
      outputs: [
        { label: "duplicated().sum()", value: "2", tone: "warning" },
        { label: "unique rows", value: "4" },
      ],
    },
    {
      id: "drop",
      label: "drop_duplicates()",
      code: "df.drop_duplicates()",
      lines: L.at("df.drop_duplicates()  "),
      views: [
        {
          frame: takeRows(F, firstIdx),
          title: "df.drop_duplicates()",
          badge: `${firstIdx.length} rows`,
          note: "Index 0, 1, 3, 5 — the gaps mark where the copies were. Row 5 survived because it is a different record, not a duplicate.",
        },
      ],
      explain:
        "With no arguments, two rows must match on every column to count as duplicates. That is the safe default, and also the one that rarely matches intent: one differing timestamp and a true duplicate slips through.",
      outputs: [
        { label: "before", value: "6 rows" },
        { label: "after", value: `${firstIdx.length} rows`, tone: "success" },
      ],
    },
    {
      id: "subset",
      label: "subset= · define 'duplicate'",
      code: 'df.drop_duplicates(subset=["user_id"])',
      lines: L.at('# one row per user'),
      views: [
        {
          frame: takeRows(F, byUserFirst),
          title: 'drop_duplicates(subset=["user_id"])',
          badge: `${byUserFirst.length} rows — one per user`,
          highlights: { "*:0": "key" },
          note: "Now row 5 goes too: user 1 has already been seen, whatever plan they later moved to. Three users, three rows.",
        },
      ],
      explain:
        "subset is where you encode the real rule. 'One row per user' and 'no identical rows' are completely different operations, and only you know which one the analysis needs.",
    },
    {
      id: "keep-last",
      label: "keep='last' · prefer the newest",
      code: 'df.drop_duplicates(subset=["user_id"], keep="last")',
      lines: L.at('keep="last"'),
      views: [
        {
          frame: takeRows(F, byUserLast),
          title: 'keep="last"',
          badge: `${byUserLast.length} rows`,
          highlights: hlRows(
            byUserLast.map((_, i) => i),
            "new",
          ),
          note: "User 1 is now represented by the max plan from February, not the pro plan from January. For a 'current state' table, that is the row you want.",
        },
      ],
      explain:
        "Combine this with a sort and you have the standard latest-record-per-key recipe: sort_values('signed_up').drop_duplicates('user_id', keep='last'). Without the sort, 'last' means last in file order, which is arbitrary.",
    },
    {
      id: "keep-false",
      label: "keep=False · drop every copy",
      code: "df.drop_duplicates(keep=False)",
      lines: L.at("keep=False)"),
      views: [
        {
          frame: takeRows(F, neverRepeated),
          title: "df.drop_duplicates(keep=False)",
          badge: `${neverRepeated.length} rows`,
          note: "Both members of each duplicate pair are gone — only rows that were never repeated at all remain.",
        },
      ],
      explain:
        "Use this when a duplicate means the record is untrustworthy rather than merely repeated: two conflicting entries for the same key, where keeping either one would be a guess. It is a filter for 'unambiguous rows only'.",
    },
    {
      id: "unique",
      label: "unique() and nunique()",
      code: 'df["user_id"].unique()',
      lines: L.at('df["user_id"].nunique()'),
      views: [
        {
          frame: resetIndex(takeRows(F, byUserFirst)),
          title: "one row per user",
          muted: true,
        },
      ],
      outputs: [
        { label: 'user_id.unique()', value: "[1, 2, 3]", tone: "accent" },
        { label: "nunique()", value: "3" },
        { label: "len(df)", value: "6" },
      ],
      explain:
        "unique() lists the distinct values in order of appearance; nunique() just counts them. Comparing nunique() against len(df) is the quickest duplicate check there is — if they differ, a key you expected to be unique is not.",
    },
  ];

  return (
    <PageShell meta={PAGES.duplicates}>
      <StepRunner runId="duplicates" code={L.code} steps={steps} />
    </PageShell>
  );
}

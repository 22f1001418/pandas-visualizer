import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Segmented } from "@/components/Segmented";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { ORDERS, USERS } from "@/data/samples";
import { listing } from "@/lib/code";
import { assign, colIndex, df, hlCol, hlRows, rows } from "@/lib/dataframe";
import type { CellValue, DataFrame, HighlightMap, Step } from "@/types";

type How = "inner" | "left" | "right" | "outer";

const L = listing(`pd.merge(orders, users, on="user_id", how="inner")   # only matched keys
pd.merge(orders, users, on="user_id", how="left")    # every LEFT row
pd.merge(orders, users, on="user_id", how="right")   # every RIGHT row
pd.merge(orders, users, on="user_id", how="outer")   # the union

pd.merge(orders, users, on="user_id", how="left", indicator=True)

pd.merge(a, b, left_on="uid", right_on="user_id")    # differently named keys

len(pd.merge(a, b, on="k"))   # ALWAYS check the row count`);

/**
 * A real merge, computed rather than transcribed — so switching `how`
 * genuinely recomputes the join instead of showing four hand-typed tables.
 */
function mergeOn(
  left: DataFrame,
  right: DataFrame,
  key: string,
  how: How,
): { frame: DataFrame; origin: Array<"both" | "left_only" | "right_only"> } {
  const lk = colIndex(left, key);
  const rk = colIndex(right, key);
  const rightCols = right.columns.filter((c) => c.name !== key);
  const rightIdxs = rightCols.map((c) => colIndex(right, c.name));

  const pairs: Array<[number | null, number | null]> = [];

  const pushLeftDriven = () => {
    left.data.forEach((lrow, li) => {
      const matches = right.data
        .map((_, ri) => ri)
        .filter((ri) => String(right.data[ri][rk]) === String(lrow[lk]));
      if (matches.length) matches.forEach((ri) => pairs.push([li, ri]));
      else if (how !== "inner") pairs.push([li, null]);
    });
  };

  if (how === "right") {
    // A right join follows the right frame's row order.
    right.data.forEach((rrow, ri) => {
      const matches = left.data
        .map((_, li) => li)
        .filter((li) => String(left.data[li][lk]) === String(rrow[rk]));
      if (matches.length) matches.forEach((li) => pairs.push([li, ri]));
      else pairs.push([null, ri]);
    });
  } else {
    pushLeftDriven();
    if (how === "outer") {
      right.data.forEach((rrow, ri) => {
        const matched = left.data.some(
          (lrow) => String(lrow[lk]) === String(rrow[rk]),
        );
        if (!matched) pairs.push([null, ri]);
      });
    }
  }

  const data: CellValue[][] = pairs.map(([li, ri]) => {
    const leftPart = left.columns.map((_, c) =>
      li === null ? (c === lk ? right.data[ri as number][rk] : null) : left.data[li][c],
    );
    const rightPart = rightIdxs.map((c) =>
      ri === null ? null : right.data[ri][c],
    );
    return [...leftPart, ...rightPart];
  });

  const origin = pairs.map(([li, ri]) =>
    li !== null && ri !== null
      ? ("both" as const)
      : li !== null
        ? ("left_only" as const)
        : ("right_only" as const),
  );

  return {
    frame: rows({
      columns: [...left.columns.map((c) => c.name), ...rightCols.map((c) => c.name)],
      data,
      dtypes: {
        order_id: how === "inner" || how === "left" ? "int64" : "float64",
        user_id: "int64",
        amount: how === "inner" || how === "left" ? "int64" : "float64",
      },
    }),
    origin,
  };
}

const HOW_NOTE: Record<How, string> = {
  inner:
    "Order 105 is gone: user 5 does not exist in the users table. User 4 is gone too — no orders. Only keys present on both sides survive.",
  left: "All five orders kept. Order 105 has no matching user, so name and city are NaN — and that NaN forces nothing here, because only the right-hand columns are affected.",
  right:
    "All four users kept, in the users table's order. User 1 appears twice because they placed two orders. User 4 has no orders at all, so order_id and amount are NaN — which drags those integer columns to float64.",
  outer:
    "Everything from both sides: the two user-1 orders, users 2 and 3, user 4 with no order, and order 105 with no user. Nothing is discarded.",
};

const HOW_EXPLAIN: Record<How, string> = {
  inner:
    "The default, and the strictest. A row survives only if its key appears on both sides, so an inner join can silently shrink your data — which is fine when you meant it and a disaster when you did not.",
  left: "The workhorse. 'Keep all my rows, add what you can find.' Enriching a transaction table with customer attributes is almost always a left join, because losing a transaction is never acceptable.",
  right:
    "A left join with the arguments swapped, and almost nobody writes it — pd.merge(users, orders, how='left') says the same thing and reads better. It is here so the symmetry is clear.",
  outer:
    "Loses nothing from either side, so the result tells you about both tables' gaps at once. Use it when reconciling two sources that are each supposed to be complete.",
};

/** Many-to-many: two matching rows on the left, three on the right. */
const DUP_LEFT = df({ k: ["x", "x"], a: [1, 2] });
const DUP_RIGHT = df({ k: ["x", "x", "x"], b: [10, 20, 30] });
const DUP_RESULT = rows({
  columns: ["k", "a", "b"],
  data: [
    ["x", 1, 10],
    ["x", 1, 20],
    ["x", 1, 30],
    ["x", 2, 10],
    ["x", 2, 20],
    ["x", 2, 30],
  ],
});

export function MergePage() {
  const [how, setHow] = useState<How>("inner");
  const { frame: merged, origin } = mergeOn(ORDERS, USERS, "user_id", how);

  const originHl: HighlightMap = {};
  origin.forEach((o, r) => {
    if (o === "left_only") originHl[`${r}:*`] = "group-b";
    else if (o === "right_only") originHl[`${r}:*`] = "group-d";
  });

  const indicator = assign(
    merged,
    "_merge",
    origin.map((o) => o),
    "category",
  );

  const steps: Step[] = [
    {
      id: "tables",
      label: "Two tables, one shared key",
      code: "orders · users",
      lines: L.at('how="inner"'),
      views: [
        {
          frame: ORDERS,
          title: "orders (left)",
          highlights: hlCol(ORDERS, "user_id", "key"),
          badge: "5 rows",
          note: "user_id values: 1, 2, 1, 3, 5. Note that 1 appears twice and 5 is an outlier.",
        },
        {
          frame: USERS,
          title: "users (right)",
          highlights: hlCol(USERS, "user_id", "key"),
          badge: "4 rows",
          note: "user_id values: 1, 2, 3, 4. There is no user 5 — and user 4 has placed no orders.",
        },
      ],
      explain:
        "The key column is the only thing the two tables have in common, and everything about the merge follows from which of its values appear on which side. Read those two lists before you choose a join type.",
      outputs: [
        { label: "keys in both", value: "1, 2, 3", tone: "success" },
        { label: "left only", value: "5", tone: "pink" },
        { label: "right only", value: "4", tone: "warning" },
      ],
    },
    {
      id: "match",
      label: "Which keys line up",
      code: 'on="user_id"',
      lines: L.at('how="inner"'),
      views: [
        {
          frame: ORDERS,
          title: "orders",
          highlights: {
            ...hlRows([0, 1, 2, 3], "mask-true"),
            ...hlRows([4], "mask-false"),
          },
          note: "Four orders find a user. Order 105 (user 5) does not.",
        },
        {
          frame: USERS,
          title: "users",
          highlights: {
            ...hlRows([0, 1, 2], "mask-true"),
            ...hlRows([3], "mask-false"),
          },
          note: "Three users are referenced by an order. Diya (user 4) is not.",
        },
      ],
      explain:
        "Matched in green, unmatched in red. The four join types are nothing more than four answers to one question: what should happen to the red rows?",
    },
    {
      id: "result",
      label: `how="${how}"`,
      code: `pd.merge(orders, users, on="user_id", how="${how}")`,
      lines: L.at(`how="${how}")`),
      views: [
        {
          frame: merged,
          title: `merge(…, how="${how}")`,
          badge: `${merged.data.length} rows × ${merged.columns.length} columns`,
          highlights: originHl,
          dtypes: true,
          note: HOW_NOTE[how],
        },
      ],
      explain: HOW_EXPLAIN[how],
      outputs: [
        { label: "left rows", value: "5" },
        { label: "right rows", value: "4" },
        { label: "result rows", value: String(merged.data.length), tone: "accent" },
      ],
      variables: [
        { name: "result.shape", type: "tuple", preview: `(${merged.data.length}, ${merged.columns.length})` },
      ],
    },
    {
      id: "indicator",
      label: "indicator=True · where did this row come from?",
      code: 'pd.merge(…, indicator=True)',
      lines: L.at("indicator=True"),
      views: [
        {
          frame: indicator,
          title: "with _merge",
          highlights: { [`*:${indicator.columns.length - 1}`]: "new" },
          badge: "_merge column added",
          note: "Every row is labelled both, left_only or right_only. df['_merge'].value_counts() then summarises the whole join in three numbers.",
        },
      ],
      explain:
        "The fastest way to debug a merge. If you expected 'both' everywhere and got thousands of left_only rows, your keys are not matching — usually a dtype mismatch (int vs string) or stray whitespace, neither of which raises an error.",
    },
    {
      id: "explosion",
      label: "Duplicate keys multiply rows",
      code: 'pd.merge(a, b, on="k")',
      lines: L.at("len(pd.merge(a, b"),
      views: [
        {
          frame: DUP_LEFT,
          title: "a",
          badge: "2 rows, key x twice",
          highlights: hlCol(DUP_LEFT, "k", "key"),
        },
        {
          frame: DUP_RIGHT,
          title: "b",
          badge: "3 rows, key x three times",
          highlights: hlCol(DUP_RIGHT, "k", "key"),
        },
        {
          frame: DUP_RESULT,
          title: 'pd.merge(a, b, on="k")',
          arrow: "2 × 3 = 6",
          badge: "6 rows!",
          highlights: hlCol(DUP_RESULT, "k", "drop"),
          note: "Every left x pairs with every right x. Two rows and three rows became six — and with a hundred duplicates on each side it would be ten thousand.",
        },
      ],
      explain:
        "A merge is a cross product per key, not a lookup. When the key is unique on at least one side you get the lookup behaviour you expected; when it is duplicated on both, rows multiply. Sums computed afterwards are then inflated, and nothing warns you.",
      outputs: [
        { label: "expected", value: "2 or 3 rows" },
        { label: "actual", value: "6 rows", tone: "danger" },
      ],
    },
    {
      id: "check",
      label: "So always check",
      code: "validate='one_to_many'",
      lines: L.at("# ALWAYS check the row count"),
      views: [
        {
          frame: merged,
          title: "result",
          muted: true,
          badge: `${merged.data.length} rows`,
        },
      ],
      explain:
        "Make the row count a habit: print len() before and after every merge. Better still, state your assumption with validate='one_to_many' or 'one_to_one' and let pandas raise a MergeError the moment the data disagrees with you.",
      outputs: [
        { label: "validate=", value: "one_to_one", tone: "success" },
        { label: "on violation", value: "MergeError", tone: "accent" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.merge}>
      <StepRunner
        runId={`merge-${how}`}
        code={L.code}
        steps={steps}
        caption="Change the join type and watch the result recompute"
        controls={
          <Segmented
            label="how"
            value={how}
            onChange={setHow}
            options={[
              { value: "inner", label: "inner", hint: "only matched keys" },
              { value: "left", label: "left", hint: "every left row" },
              { value: "right", label: "right", hint: "every right row" },
              { value: "outer", label: "outer", hint: "the union" },
            ]}
          />
        }
      />
    </PageShell>
  );
}

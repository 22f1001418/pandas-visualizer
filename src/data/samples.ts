import { df } from "@/lib/dataframe";
import type { DataFrame } from "@/types";

/**
 * Shared teaching datasets.
 *
 * Deliberately tiny: every frame fits on screen without scrolling, so a
 * learner can verify an aggregation by hand and see that pandas agrees.
 */

/** Primary dataset: student scores. Used by most lessons. */
export const STUDENTS: DataFrame = df({
  name: ["Aarav", "Priya", "Ishaan", "Diya", "Kabir", "Zoya"],
  batch: ["DSML", "DSML", "SWE", "DSML", "SWE", "SWE"],
  score: [91, 88, 74, 95, 82, 68],
  attempts: [2, 1, 3, 1, 2, 3],
  passed: [true, true, true, true, true, false],
});

/** Variant with holes, for the missing-data lesson. */
export const STUDENTS_WITH_NA: DataFrame = df({
  name: ["Aarav", "Priya", "Ishaan", "Diya", "Kabir", "Zoya"],
  batch: ["DSML", "DSML", "SWE", null, "SWE", "SWE"],
  score: [91, null, 74, 95, null, 68],
  attempts: [2, 1, null, 1, 2, 3],
});

/** Numbers that arrived as text — for the dtype lesson. */
export const STUDENTS_AS_TEXT: DataFrame = df(
  {
    name: ["Aarav", "Priya", "Ishaan", "Diya"],
    score: ["91", "88", "74", "n/a"],
    joined: ["2025-01-07", "2025-01-09", "2025-02-02", "2025-02-14"],
  },
  { dtypes: { name: "object", score: "object", joined: "object" } },
);

/** Two related tables, for merge. */
export const ORDERS: DataFrame = df({
  order_id: [101, 102, 103, 104, 105],
  user_id: [1, 2, 1, 3, 5],
  amount: [420, 150, 75, 980, 260],
});

export const USERS: DataFrame = df({
  user_id: [1, 2, 3, 4],
  name: ["Aarav", "Priya", "Ishaan", "Diya"],
  city: ["Pune", "Delhi", "Mumbai", "Bengaluru"],
});

/** Two monthly exports with the same schema, for concat. */
export const JAN_SALES: DataFrame = df({
  region: ["North", "South"],
  revenue: [120, 90],
});

export const FEB_SALES: DataFrame = df({
  region: ["North", "South"],
  revenue: [145, 105],
});

/** A third file that picked up an extra column — concat's outer join case. */
export const MAR_SALES: DataFrame = df({
  region: ["North", "South"],
  revenue: [160, 130],
  refunds: [12, 4],
});

/** Long format: one row per (region, month) observation. For pivot & melt. */
export const SALES_LONG: DataFrame = df({
  region: ["North", "North", "North", "South", "South", "South"],
  month: ["Jan", "Feb", "Mar", "Jan", "Feb", "Mar"],
  revenue: [120, 145, 160, 90, 105, 130],
});

/** Text to clean, for the .str lesson. */
export const EMAILS: DataFrame = df({
  user: ["Aarav Sharma", " priya_k ", "ISHAAN-R", "Diya M."],
  email: [
    "aarav@scaler.com",
    "priya.k@gmail.com",
    "ishaan.r@scaler.com",
    "diya@yahoo.com",
  ],
});

/** A daily series, for datetime, resample and window functions. */
export const SALES_DAILY: DataFrame = df({
  date: [
    "2025-03-01",
    "2025-03-02",
    "2025-03-03",
    "2025-03-04",
    "2025-03-05",
    "2025-03-06",
  ],
  units: [12, 18, 9, 21, 25, 16],
});

/** Event log with timestamps, for the .dt accessor. */
export const EVENTS: DataFrame = df({
  event: ["login", "purchase", "login", "logout", "purchase"],
  timestamp: [
    "2025-03-01 09:14",
    "2025-03-01 10:02",
    "2025-03-02 08:47",
    "2025-03-02 18:20",
    "2025-03-03 11:15",
  ],
  amount: [0, 420, 0, 0, 150],
});

/** A table that got appended twice, for the duplicates lesson. */
export const SIGNUPS: DataFrame = df({
  user_id: [1, 2, 1, 3, 2, 1],
  plan: ["pro", "free", "pro", "free", "free", "max"],
  signed_up: [
    "2025-01-04",
    "2025-01-06",
    "2025-01-04",
    "2025-01-09",
    "2025-01-06",
    "2025-02-11",
  ],
});

/** The raw text behind read_csv, shown verbatim in the loading lesson. */
export const RAW_CSV = `name,batch,score,attempts,passed
Aarav,DSML,91,2,True
Priya,DSML,88,1,True
Ishaan,SWE,74,3,True
Diya,DSML,95,1,True
Kabir,SWE,82,2,True
Zoya,SWE,68,3,False`;

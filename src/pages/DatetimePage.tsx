import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { EVENTS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlCol,
  rows,
  series,
  setIndex,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df.dtypes                         # timestamp is "object" — just text

df["timestamp"] = pd.to_datetime(df["timestamp"])

df["timestamp"].dt.date           # the .dt accessor
df["timestamp"].dt.day_name()
df["timestamp"].dt.hour

df["timestamp"].max() - df["timestamp"].min()   # a Timedelta

df = df.set_index("timestamp")    # resample needs a DatetimeIndex
df["amount"].resample("D").sum()  # one row per day

pd.date_range("2025-03-01", periods=3, freq="D")`);

const stamps = col(EVENTS, "timestamp") as string[];
const DATES = ["2025-03-01", "2025-03-01", "2025-03-02", "2025-03-02", "2025-03-03"];
const DAYS = ["Saturday", "Saturday", "Sunday", "Sunday", "Monday"];
const HOURS = [9, 10, 8, 18, 11];

const parsed = assign(EVENTS, "timestamp", stamps, "datetime64");

const dtParts = rows({
  columns: ["dt.date", "dt.day_name()", "dt.hour"],
  data: DATES.map((d, i) => [d, DAYS[i], HOURS[i]]),
  dtypes: { "dt.date": "object", "dt.day_name()": "object", "dt.hour": "int64" },
});

const RESAMPLED = series("amount", [420, 0, 150], {
  index: ["2025-03-01", "2025-03-02", "2025-03-03"],
  indexName: "timestamp",
});

const RANGE = series(
  "0",
  ["2025-03-01", "2025-03-02", "2025-03-03"],
  { dtype: "datetime64" },
);

export function DatetimePage() {
  const steps: Step[] = [
    {
      id: "text",
      label: "Timestamps arrive as text",
      code: "df.dtypes",
      lines: L.at("df.dtypes"),
      views: [
        {
          frame: EVENTS,
          title: "df",
          dtypes: true,
          highlights: hlCol(EVENTS, "timestamp", "null"),
          note: "object dtype. These are strings that happen to look like times — pandas has not understood them as moments yet.",
        },
      ],
      explain:
        "read_csv does not parse dates unless you ask. Until you convert, you cannot subtract two timestamps, cannot ask which weekday it was, and cannot resample — the characters simply have no meaning.",
      outputs: [{ label: "timestamp dtype", value: "object", tone: "warning" }],
    },
    {
      id: "parse",
      label: "to_datetime",
      code: 'pd.to_datetime(df["timestamp"])',
      lines: L.at("pd.to_datetime"),
      views: [
        {
          frame: parsed,
          title: "df",
          dtypes: true,
          highlights: hlCol(parsed, "timestamp", "new"),
          note: "Identical on screen, entirely different underneath: datetime64[ns] stores each moment as a 64-bit integer count of nanoseconds since 1970.",
        },
      ],
      explain:
        "One call unlocks the whole time-series toolkit. Do it at load time with read_csv(parse_dates=['timestamp']) rather than later, so no code downstream ever sees the string version.",
      outputs: [{ label: "dtype", value: "datetime64[ns]", tone: "success" }],
    },
    {
      id: "dt",
      label: ".dt · pull the parts out",
      code: 'df["timestamp"].dt.day_name()',
      lines: L.range('df["timestamp"].dt.date', 'df["timestamp"].dt.hour'),
      views: [
        {
          frame: dtParts,
          title: ".dt accessor",
          badge: "three derived columns",
          highlights: { "*:0": "new", "*:1": "new", "*:2": "new" },
          note: "date, day_name, hour — and also year, month, quarter, dayofweek, is_month_end, and a dozen more.",
        },
      ],
      explain:
        ".dt is to datetimes what .str is to strings: an accessor that only appears once the dtype is right. Calling it on an object column raises 'Can only use .dt accessor with datetimelike values' — which is the error that sends people back to to_datetime.",
      variables: [
        { name: "dt.dayofweek", type: "Series[int]", preview: "5,5,6,6,0" },
      ],
    },
    {
      id: "delta",
      label: "Arithmetic on dates",
      code: 'df["timestamp"].max() - df["timestamp"].min()',
      lines: L.at("- df[\"timestamp\"].min()"),
      views: [
        {
          frame: parsed,
          title: "df",
          highlights: { "0:1": "match", "4:1": "match" },
          badge: "first and last",
          note: "Subtracting two datetimes gives a Timedelta, not a number. .dt.days or .dt.total_seconds() turns it into one.",
        },
      ],
      outputs: [
        { label: "span", value: "2 days 02:01:00", tone: "accent" },
        { label: ".dt.days", value: "2" },
      ],
      explain:
        "Durations get their own dtype, timedelta64, which keeps the units attached and prevents the classic unit mix-up. Adding a Timedelta to a date shifts it: ts + pd.Timedelta(days=7).",
    },
    {
      id: "resample",
      label: "resample · groupby for time",
      code: 'df["amount"].resample("D").sum()',
      lines: L.range("df = df.set_index", 'df["amount"].resample("D").sum()'),
      views: [
        {
          frame: setIndex(parsed, "timestamp"),
          title: 'df.set_index("timestamp")',
          muted: true,
          badge: "DatetimeIndex",
        },
        {
          frame: RESAMPLED,
          title: 'resample("D").sum()',
          series: true,
          arrow: "bucket by calendar day, then sum",
          highlights: { "0:0": "new", "1:0": "new", "2:0": "new" },
          note: "Five events became three days. 1 March: 0 + 420. 2 March: two events, both 0. 3 March: 150.",
        },
      ],
      explain:
        "resample is groupby where the key is a time bucket. 'D' is daily, 'W' weekly, 'ME' month-end, 'h' hourly. It needs the time in the index, which is why set_index comes first — and unlike groupby it emits empty buckets too, so gaps in your data show up as zeros rather than disappearing.",
      outputs: [
        { label: "rows before", value: "5" },
        { label: "rows after", value: "3", tone: "accent" },
      ],
    },
    {
      id: "range",
      label: "date_range · generate them",
      code: 'pd.date_range("2025-03-01", periods=3, freq="D")',
      lines: L.at("pd.date_range"),
      views: [
        {
          frame: RANGE,
          title: 'pd.date_range("2025-03-01", periods=3, freq="D")',
          series: true,
          dtypes: true,
          note: "A DatetimeIndex built from nothing. Useful as a reindex target: it exposes the days your data is missing entirely.",
        },
      ],
      explain:
        "The companion to resample. Build the calendar you expect, reindex your data onto it, and every missing day becomes an explicit NaN row — far better than silently having no row at all.",
    },
  ];

  return (
    <PageShell meta={PAGES.datetime}>
      <StepRunner runId="datetime" code={L.code} steps={steps} />
    </PageShell>
  );
}

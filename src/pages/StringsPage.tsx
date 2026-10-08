import { PageShell } from "@/components/PageShell";
import { StepRunner } from "@/components/StepRunner";
import { PAGES } from "./registry";
import { EMAILS } from "@/data/samples";
import { listing } from "@/lib/code";
import {
  assign,
  col,
  hlCol,
  hlRows,
  series,
  takeRows,
  whereRows,
} from "@/lib/dataframe";
import type { Step } from "@/types";

const L = listing(`df["user"].str.strip().str.lower()        # chain them

df["email"].str.split("@")                # a list per row
df["email"].str.split("@").str[1]         # .str[i] picks one piece

df["email"].str.contains("scaler")        # a boolean mask
df[df["email"].str.contains("scaler")]    # …used to filter

df["user"].str.replace("-", " ", regex=False)
df["email"].str.extract(r"(\\w+)@(\\w+)\\.")    # regex groups -> columns

df["email"].str.contains("scaler", na=False)  # NaN-safe`);

const users = col(EMAILS, "user") as string[];
const emails = col(EMAILS, "email") as string[];

const cleaned = assign(
  EMAILS,
  "user",
  users.map((u) => u.trim().toLowerCase()),
);

const splitList = assign(
  EMAILS,
  "email",
  emails.map((e) => `['${e.split("@")[0]}', '${e.split("@")[1]}']`),
);

const domains = series(
  "domain",
  emails.map((e) => e.split("@")[1]),
  { index: EMAILS.index },
);

const replaced = assign(
  EMAILS,
  "user",
  users.map((u) => u.replace(/-/g, " ")),
);

const extracted = series("0", emails.map((e) => e.split("@")[0]), {
  index: EMAILS.index,
});

export function StringsPage() {
  const scalerIdx = whereRows(EMAILS, (r) =>
    String(r.email).includes("scaler"),
  );
  const mask = series(
    'contains("scaler")',
    emails.map((e) => e.includes("scaler")),
  );

  const extractFrame = {
    ...EMAILS,
    columns: [
      { name: "0", dtype: "object" as const },
      { name: "1", dtype: "object" as const },
    ],
    data: emails.map((e) => [e.split("@")[0], e.split("@")[1].split(".")[0]]),
  };

  const steps: Step[] = [
    {
      id: "messy",
      label: "Four kinds of mess",
      code: "df",
      lines: L.at("str.strip().str.lower()"),
      views: [
        {
          frame: EMAILS,
          title: "df",
          dtypes: true,
          highlights: hlCol(EMAILS, "user", "null"),
          note: 'Mixed casing, a stray leading and trailing space on " priya_k ", a hyphen in "ISHAAN-R", a full stop in "Diya M.". Four rows, four different problems.',
        },
      ],
      explain:
        "Text columns are object dtype, which means each value is a separate Python string object. The .str accessor exists to run string methods across all of them without you writing a loop.",
    },
    {
      id: "clean",
      label: "strip + lower, chained",
      code: 'df["user"].str.strip().str.lower()',
      lines: L.at("str.strip().str.lower()"),
      views: [
        { frame: EMAILS, title: "df", muted: true },
        {
          frame: cleaned,
          title: "cleaned",
          arrow: "strip the spaces, then lower the case",
          highlights: hlCol(EMAILS, "user", "changed"),
          note: "Each .str call returns a Series, so the next .str starts again from the new values. Note the second .str — it is required; .strip().lower() would fail.",
        },
      ],
      explain:
        "Normalising case and whitespace is the first thing to do with any text key, because 'Priya' , ' priya' and 'PRIYA' are three different values to a groupby or a merge. Most mysterious join failures are this.",
      outputs: [
        { label: "before", value: '" priya_k "' },
        { label: "after", value: '"priya_k"', tone: "success" },
      ],
    },
    {
      id: "split",
      label: "split · one value becomes a list",
      code: 'df["email"].str.split("@")',
      lines: L.at('# a list per row'),
      views: [
        {
          frame: splitList,
          title: 'df["email"].str.split("@")',
          highlights: hlCol(EMAILS, "email", "changed"),
          badge: "a list in every cell",
          note: "Still one column — but each cell now holds a two-element Python list. This is a staging post, not usually the answer.",
        },
      ],
      explain:
        "split gives you lists inside cells, which is an awkward place to be: object dtype, no vectorised operations. Pass expand=True to get a proper DataFrame of columns instead.",
    },
    {
      id: "index",
      label: ".str[1] · pick one piece",
      code: 'df["email"].str.split("@").str[1]',
      lines: L.at(".str[1]"),
      views: [
        {
          frame: domains,
          title: 'split("@").str[1]',
          series: true,
          highlights: hlRows([0, 1, 2, 3], "new"),
          note: "The second .str indexes into each list, giving back a flat Series of domains. Chaining .str twice like this is the standard idiom.",
        },
      ],
      explain:
        "Extracting the domain is the classic example, and it generalises: split on a separator, take the piece you want. For anything more structured than that, extract with a regex is clearer.",
      variables: [
        { name: "domains.nunique()", type: "int", preview: "3" },
      ],
    },
    {
      id: "contains",
      label: "contains · text → mask",
      code: 'df["email"].str.contains("scaler")',
      lines: L.at('# a boolean mask'),
      views: [
        {
          frame: mask,
          title: 'email.str.contains("scaler")',
          series: true,
          dtypes: true,
          highlights: {
            ...hlRows(scalerIdx, "mask-true"),
            ...hlRows(
              EMAILS.data.map((_, i) => i).filter((i) => !scalerIdx.includes(i)),
              "mask-false",
            ),
          },
          note: "An ordinary boolean mask — the same kind the filtering lesson built with >. Everything you know about & and | applies.",
        },
        {
          frame: takeRows(EMAILS, scalerIdx),
          title: "df[mask]",
          arrow: "filter with it",
          badge: `${scalerIdx.length} rows`,
        },
      ],
      explain:
        "This is how text joins the rest of pandas: contains, startswith, endswith and match all produce masks. Pattern-matching a column therefore composes with every other filter you write.",
    },
    {
      id: "replace",
      label: "replace · and the regex default",
      code: 'df["user"].str.replace("-", " ", regex=False)',
      lines: L.at("str.replace"),
      views: [
        {
          frame: replaced,
          title: "replaced",
          highlights: { "2:0": "changed" },
          badge: "ISHAAN-R → ISHAAN R",
          note: 'Only row 2 changed. Note regex=False: a literal "." as a pattern would otherwise match every single character.',
        },
      ],
      explain:
        "str.replace treats its pattern as a regex by default, which quietly breaks any pattern containing . ( ) [ ] * + ? | — so '3.14' → replace('.', '') empties the whole string. Pass regex=False whenever you mean a literal.",
    },
    {
      id: "extract",
      label: "extract · regex groups → columns",
      code: 'df["email"].str.extract(r"(\\w+)@(\\w+)\\.")',
      lines: L.at("str.extract"),
      views: [
        {
          frame: extractFrame,
          title: 'email.str.extract(r"(\\w+)@(\\w+)\\.")',
          badge: "2 capture groups → 2 columns",
          highlights: { "*:0": "new", "*:1": "new" },
          note: "One column per capture group, numbered 0 and 1. Use named groups — (?P<user>\\w+) — and the columns get those names instead.",
        },
      ],
      explain:
        "extract is the right tool when the structure is real: ids embedded in filenames, codes inside SKUs, fields in a log line. One pass produces several clean columns, and anything that fails to match becomes NaN rather than an error.",
    },
    {
      id: "na",
      label: "The NaN trap",
      code: 'df["email"].str.contains("scaler", na=False)',
      lines: L.at("na=False"),
      views: [
        {
          frame: EMAILS,
          title: "df",
          muted: true,
        },
      ],
      stdout: `# with a missing email in the column:
ValueError: Cannot mask with non-boolean array containing NA / NaN values`,
      explain:
        "A .str method returns NaN for a missing input — neither True nor False — and a mask containing NaN cannot index a frame. na=False says 'treat missing as not matching', which is nearly always what you want when filtering.",
      outputs: [
        { label: "without na=", value: "raises", tone: "danger" },
        { label: "na=False", value: "works", tone: "success" },
      ],
    },
  ];

  return (
    <PageShell meta={PAGES.strings}>
      <StepRunner runId="strings" code={L.code} steps={steps} />
    </PageShell>
  );
}

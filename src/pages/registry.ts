import type { PageMeta } from "@/types";

/**
 * Every lesson in the app, in curriculum order.
 *
 * This file is the single source of truth: the sidebar, the command palette,
 * the prev/next footer, the router and the page-component switch all read it.
 */
export const LESSON_IDS = [
  // Foundations
  "overview",
  "create",
  "inspect",
  "series",
  "dtypes",
  // Selecting
  "selection",
  "filtering",
  "query",
  "indexing",
  "copyview",
  // Cleaning
  "missing",
  "duplicates",
  "strings",
  "datetime",
  // Transforming
  "columns",
  "apply",
  "sorting",
  "window",
  // Aggregating
  "groupby",
  "aggregate",
  "valuecounts",
  // Combining & reshaping
  "merge",
  "concat",
  "pivot",
  "stack",
  // Reference
  "cheatsheet",
  "pitfalls",
] as const;

export type PageId = (typeof LESSON_IDS)[number];

const DOCS = "https://pandas.pydata.org/docs/reference/api/";

export const PAGES: Record<PageId, PageMeta> = {
  /* ===================================================================
     FOUNDATIONS
     =================================================================== */
  overview: {
    id: "overview",
    title: "DataFrames & Series",
    short: "DataFrames & Series",
    icon: "LayoutGrid",
    keywords: "dataframe series index columns values anatomy axis shape",
    blurb:
      "The two core pandas objects — a 2-D labelled table and a 1-D labelled column.",
    context: {
      what: "A DataFrame is a 2-D table with row and column labels. A Series is a single column of a DataFrame — a 1-D array with an index.",
      why: "Everything in pandas is built on these two objects. Understanding their anatomy (index, columns, dtypes, values) makes every other operation click.",
      how: "Think of a DataFrame as a dict of Series sharing the same index. Selecting a single column gives you a Series; selecting a single row also gives you a Series.",
    },
    api: ["df.shape", "df.index", "df.columns", "df.dtypes", "df.values", "df.T"],
    keyPoints: [
      "A DataFrame has three parts: the index (row labels), the columns (column labels), and the values (the data block).",
      "The index is not a column. It travels with each row through filters, sorts and joins.",
      "axis=0 means 'down the rows'; axis=1 means 'across the columns'. df.mean() defaults to axis=0.",
      "One column out of a DataFrame is a Series; two or more is a smaller DataFrame.",
    ],
    gotcha:
      "df['score'] gives a Series, but df[['score']] gives a one-column DataFrame. Same data, different type — and methods differ between them.",
    docs: "https://pandas.pydata.org/docs/user_guide/dsintro.html",
    quiz: [
      {
        q: "df has 6 rows and 5 columns. What does df.shape return?",
        options: ["(5, 6)", "(6, 5)", "[6, 5]", "30"],
        answer: 1,
        why: "shape is always a tuple of (rows, columns) — rows first, matching NumPy's convention.",
      },
      {
        q: "What type is df[['name']]?",
        options: ["Series", "DataFrame", "Index", "list"],
        answer: 1,
        why: "A list of column names selects a sub-table, so you get a DataFrame — even when the list has one element.",
      },
    ],
  },

  create: {
    id: "create",
    title: "Creating & Loading Data",
    short: "Creating Data",
    icon: "Database",
    keywords: "create dataframe dict list records read_csv read_excel from_dict io load",
    blurb:
      "Build a DataFrame from a dict, a list of rows, or a file on disk.",
    context: {
      what: "A DataFrame can be constructed from a dict of columns, a list of row-records, a NumPy array, or read straight from CSV, Excel, JSON, SQL or Parquet.",
      why: "This is step one of every analysis. The shape of your input decides whether pandas reads your data as columns or as rows — get it wrong and the table comes out transposed.",
      how: "pd.DataFrame({'col': [...]}) treats each key as a column. pd.DataFrame([{...}, {...}]) treats each dict as a row. pd.read_csv(path) infers columns and dtypes from the file.",
    },
    api: [
      "pd.DataFrame(dict)",
      "pd.DataFrame(records)",
      "pd.read_csv()",
      "pd.read_excel()",
      "df.to_csv()",
    ],
    keyPoints: [
      "Dict of lists → keys become columns. List of dicts → each dict becomes a row, keys become columns.",
      "read_csv does a lot of guessing: delimiter, header row, dtypes, and which strings mean 'missing'.",
      "Pass index_col= to promote a file column to the index, and parse_dates= to get real datetimes instead of strings.",
      "df.to_csv('out.csv', index=False) is the usual way out — without index=False you get an unnamed extra column on re-read.",
    ],
    gotcha:
      "pd.DataFrame(my_dict) with scalar values instead of lists raises 'If using all scalar values, you must pass an index'. Wrap the values in lists, or pass index=[0].",
    docs: "https://pandas.pydata.org/docs/user_guide/io.html",
    quiz: [
      {
        q: "pd.DataFrame([{'a': 1, 'b': 2}, {'a': 3, 'b': 4}]) produces a table of what shape?",
        options: ["2 rows × 2 columns", "2 rows × 1 column", "4 rows × 1 column", "1 row × 2 columns"],
        answer: 0,
        why: "A list of dicts is read as a list of rows; the union of the keys becomes the columns. Two dicts with two keys → 2 × 2.",
      },
      {
        q: "Which read_csv argument turns a date column into real datetimes?",
        options: ["dtype=", "parse_dates=", "converters=", "date_format="],
        answer: 1,
        why: "parse_dates=['col'] runs the datetime parser on that column. Without it, dates stay as object (string) dtype.",
      },
    ],
  },

  inspect: {
    id: "inspect",
    title: "Inspecting a DataFrame",
    short: "Inspecting Data",
    icon: "Search",
    keywords: "head tail info describe shape sample memory nunique summary explore eda",
    blurb:
      "The first five commands you run on any new dataset.",
    context: {
      what: "head/tail show the edges of the table, info reports dtypes and non-null counts, describe computes summary statistics, and sample draws random rows.",
      why: "Before you compute anything you need to know how big the data is, what types the columns are, and where the holes are. These methods answer that in seconds.",
      how: "df.head() for a peek, df.info() for the schema and missing-value audit, df.describe() for the numeric distribution. Chain .T on describe for a wide-table view.",
    },
    api: ["df.head()", "df.tail()", "df.info()", "df.describe()", "df.sample()", "df.nunique()"],
    keyPoints: [
      "info() is the missing-data audit: compare each column's non-null count against the row count.",
      "describe() covers numeric columns only by default; pass include='all' to summarise object columns too.",
      "describe() on object columns reports count, unique, top and freq instead of mean and std.",
      "sample(5) beats head(5) when the file is sorted — the first five rows of a sorted file are not representative.",
    ],
    gotcha:
      "info() prints to stdout and returns None. x = df.info() stores nothing. Use df.dtypes or df.count() if you need the values as data.",
    docs: "https://pandas.pydata.org/docs/user_guide/basics.html",
    quiz: [
      {
        q: "A column shows 'non-null count = 4' while the DataFrame has 6 rows. What does that mean?",
        options: ["4 rows are duplicated", "2 values are missing", "The column has 4 unique values", "The column is the wrong dtype"],
        answer: 1,
        why: "info() counts non-null entries. 6 rows minus 4 non-null is 2 missing values in that column.",
      },
      {
        q: "Which columns does df.describe() summarise by default?",
        options: ["Every column", "Numeric columns only", "Object columns only", "The index"],
        answer: 1,
        why: "By default describe() restricts itself to numeric dtypes. include='all' widens it to every column.",
      },
    ],
  },

  series: {
    id: "series",
    title: "Series: The 1-D Object",
    short: "Series",
    icon: "LineChart",
    keywords: "series 1d index values broadcasting vectorised scalar arithmetic alignment",
    blurb:
      "Single columns, element-wise arithmetic, and aggregations on 1-D labelled arrays.",
    context: {
      what: "A Series is a 1-D array with an index. Every value has both an integer position (0, 1, 2, …) and an index label. It is one half of the DataFrame equation.",
      why: "Most pandas operations return a Series. Selection, filtering, groupby aggregations and broadcasting all centre on it. Master Series and the rest follows.",
      how: "Create one from a list or dict. Slice with .loc[] and .iloc[]. Apply scalar operations: s + 1, s * 2. Chain methods: s.mean(), s.value_counts().",
    },
    api: ["pd.Series()", "s.values", "s.index", "s.mean()", "s.describe()", "s.astype()"],
    keyPoints: [
      "Arithmetic on a Series is element-wise and vectorised — s * 2 doubles every value with no Python loop.",
      "A comparison returns a boolean Series of the same length, which is exactly what filtering consumes.",
      "Operations between two Series align on the index, not on position. Non-matching labels produce NaN.",
      "Aggregations (mean, sum, max) collapse a Series to a single scalar; they skip NaN by default.",
    ],
    gotcha:
      "Index alignment surprises people: s1 + s2 matches labels, so adding two Series with different indexes gives NaN where labels do not overlap. Use .values or .reset_index(drop=True) to add by position.",
    docs: `${DOCS}pandas.Series.html`,
    quiz: [
      {
        q: "scores = pd.Series([91, 88, 74]). What is scores * 2?",
        options: ["A Series [182, 176, 148]", "A Series of length 6", "An error", "The scalar 506"],
        answer: 0,
        why: "Scalar multiplication broadcasts across every element, returning a Series of the same length and index.",
      },
      {
        q: "Two Series with partially overlapping indexes are added. What appears at the non-overlapping labels?",
        options: ["0", "NaN", "They are dropped", "The left value"],
        answer: 1,
        why: "pandas aligns on the index and produces the union of labels; a label present in only one Series has nothing to add, so the result is NaN.",
      },
    ],
  },

  dtypes: {
    id: "dtypes",
    title: "Dtypes & Type Conversion",
    short: "Dtypes & astype",
    icon: "Tags",
    keywords: "dtype astype int64 float64 object category bool memory to_numeric convert",
    blurb:
      "Why a column of numbers can still be text — and how to fix it.",
    context: {
      what: "Every column has one dtype: int64, float64, bool, object (usually strings), datetime64, or category. The dtype decides which operations are legal and how much memory the column takes.",
      why: "A numeric column read as object silently breaks sums, sorts and comparisons — '9' > '10' is True for strings. Most 'pandas is giving wrong answers' bugs are dtype bugs.",
      how: "Check with df.dtypes. Convert with .astype('int64'), or pd.to_numeric(col, errors='coerce') when some values are not parseable.",
    },
    api: ["df.dtypes", "s.astype()", "pd.to_numeric()", "df.convert_dtypes()", "df.memory_usage()"],
    keyPoints: [
      "object dtype means 'arbitrary Python objects' — for a text column, every value is a separate Python string.",
      "An int64 column that receives a NaN is promoted to float64, because NaN is a float. This is why counts come back as 91.0.",
      "astype() raises on bad values; pd.to_numeric(errors='coerce') turns them into NaN instead.",
      "category dtype stores repeated strings once and keeps integer codes per row — a large memory win on low-cardinality columns.",
    ],
    gotcha:
      "Sorting an object column of numbers sorts lexicographically: '100' comes before '9'. Always convert to a numeric dtype before you sort or compare.",
    docs: "https://pandas.pydata.org/docs/user_guide/basics.html#dtypes",
    quiz: [
      {
        q: "An int64 column gets one NaN assigned into it. What is the dtype afterwards?",
        options: ["int64", "float64", "object", "bool"],
        answer: 1,
        why: "NaN is a float, and a NumPy int64 array cannot hold it, so pandas promotes the whole column to float64.",
      },
      {
        q: "Which call converts '12', '7', 'n/a' to numbers without raising?",
        options: ["s.astype(int)", "pd.to_numeric(s)", "pd.to_numeric(s, errors='coerce')", "s.astype(float)"],
        answer: 2,
        why: "errors='coerce' replaces unparseable values with NaN. The other three all raise on 'n/a'.",
      },
    ],
  },

  /* ===================================================================
     SELECTING
     =================================================================== */
  selection: {
    id: "selection",
    title: "Selection: .loc and .iloc",
    short: ".loc and .iloc",
    icon: "Crosshair",
    keywords: "loc iloc at iat selection label position slice subset indexing",
    blurb:
      "Pick rows and columns by label (.loc) or by integer position (.iloc).",
    context: {
      what: ".loc selects by label — the actual index values and column names. .iloc selects by integer position — 0, 1, 2 — ignoring labels.",
      why: "Mixing up the two is the single most common pandas bug. .loc is inclusive at both ends of a slice; .iloc is exclusive at the end, like a Python list.",
      how: "df.loc[row_labels, col_labels] or df.iloc[row_positions, col_positions]. Either side accepts a scalar, a list, a slice, or a boolean mask.",
    },
    api: ["df.loc[]", "df.iloc[]", "df.at[]", "df.iat[]", "df[col]"],
    keyPoints: [
      "df.loc[0:2] returns three rows (labels 0, 1 and 2). df.iloc[0:2] returns two.",
      "A scalar for both axes returns a single value; a list on either axis keeps the result 2-D.",
      "df['col'] selects a column, but df[0:2] slices rows. Plain [] is overloaded — .loc/.iloc are not.",
      "Use .at / .iat for single-cell access; they skip the general machinery and are much faster in loops.",
    ],
    gotcha:
      "After filtering or sorting, labels no longer match positions: df.loc[0] is the row labelled 0, which may now be the fourth row. If you mean 'the first row', that is df.iloc[0].",
    docs: "https://pandas.pydata.org/docs/user_guide/indexing.html",
    quiz: [
      {
        q: "For a default integer index, how many rows does df.loc[2:4] return?",
        options: ["2", "3", "4", "It raises"],
        answer: 1,
        why: ".loc slices are inclusive on both ends, so labels 2, 3 and 4 all come back — three rows.",
      },
      {
        q: "The index is ['a','b','c']. What does df.iloc[1] return?",
        options: ["The row labelled 1", "The row labelled 'b'", "A KeyError", "The second column"],
        answer: 1,
        why: ".iloc works on position: position 1 is the second row, which carries the label 'b'.",
      },
    ],
  },

  filtering: {
    id: "filtering",
    title: "Filtering with Boolean Masks",
    short: "Boolean Filtering",
    icon: "Filter",
    keywords: "filter boolean mask where condition and or not subset rows",
    blurb:
      "Build a True/False array for each row, then keep only the True ones.",
    context: {
      what: "A boolean mask is a Series of True/False values, one per row. Passing it to df[...] keeps only the rows where the mask is True.",
      why: "Boolean indexing is pandas' answer to SQL's WHERE. It is vectorised — no Python loop — and composes cleanly with & (and), | (or) and ~ (not).",
      how: "Write df[df['score'] > 80]. The inner expression builds the mask; the outer df[...] applies it. Wrap each condition in parentheses when you combine them.",
    },
    api: ["df[mask]", "&", "|", "~", "df.where()", "df.mask()"],
    keyPoints: [
      "The mask is a first-class object: m = df['score'] > 80 can be stored, inspected, inverted and reused.",
      "Use & | ~ on Series, not Python's and/or/not — the keywords try to collapse the Series to a single truth value and raise.",
      "Operator precedence makes the parentheses mandatory: df[(a > 1) & (b < 2)], never df[a > 1 & b < 2].",
      "mask.sum() counts the matching rows, because True counts as 1.",
    ],
    gotcha:
      "Forgetting the parentheses gives 'ValueError: The truth value of a Series is ambiguous' — or worse, a silently wrong answer, because & binds tighter than > does.",
    docs: "https://pandas.pydata.org/docs/user_guide/indexing.html#boolean-indexing",
    quiz: [
      {
        q: "Why does df[df.a > 1 and df.b < 2] fail?",
        options: [
          "and is not vectorised — use &",
          "The columns need quotes",
          "You must call .values first",
          "It needs .loc",
        ],
        answer: 0,
        why: "Python's `and` wants a single True/False, so it calls bool() on a whole Series and raises. Element-wise logic needs & with parentheses.",
      },
      {
        q: "m = df['score'] > 80. What is m.sum()?",
        options: ["The total of the scores above 80", "The number of rows where score > 80", "True", "The mean score"],
        answer: 1,
        why: "Summing a boolean Series adds 1 per True, so it counts matching rows.",
      },
    ],
  },

  query: {
    id: "query",
    title: "isin, between & query",
    short: "isin & query",
    icon: "Braces",
    keywords: "isin between query eval string expression filter sql-like notna",
    blurb:
      "Shorter, more readable ways to express the same filters.",
    context: {
      what: "isin() tests membership against a list, between() tests a numeric range, and query() lets you write the whole filter as a string expression.",
      why: "Chained OR conditions get unreadable fast. col.isin(['A','B','C']) replaces three comparisons, and query('score > 80 and batch == \"DSML\"') reads like SQL.",
      how: "df[df['batch'].isin(['DSML'])], df[df['score'].between(80, 90)], df.query('score > 80'). Reference a Python variable inside query with @name.",
    },
    api: ["s.isin()", "s.between()", "df.query()", "df.eval()", "s.notna()"],
    keyPoints: [
      "isin() takes any iterable and returns a boolean mask — negate it with ~ for 'not in'.",
      "between(a, b) is inclusive on both ends by default; pass inclusive='neither' to exclude them.",
      "query() needs no parentheses and no df[...] repetition, and accepts and/or/not as words.",
      "Inside query(), @my_var reaches out to a Python variable, and backticks let you use `column names with spaces`.",
    ],
    gotcha:
      "query() evaluates a string, so your editor cannot check the column names — a typo surfaces only at runtime. It is also slower than a plain mask on small frames.",
    docs: `${DOCS}pandas.DataFrame.query.html`,
    quiz: [
      {
        q: "What does ~df['batch'].isin(['SWE']) select?",
        options: ["Rows where batch is SWE", "Rows where batch is not SWE", "An error", "All rows"],
        answer: 1,
        why: "isin builds a True-where-member mask, and ~ inverts it, giving 'not in'.",
      },
      {
        q: "How do you use the Python variable cutoff inside df.query()?",
        options: ["query('score > cutoff')", "query('score > @cutoff')", "query('score > {cutoff}')", "query('score > $cutoff')"],
        answer: 1,
        why: "query resolves @name against the surrounding Python scope; a bare name is read as a column.",
      },
    ],
  },

  indexing: {
    id: "indexing",
    title: "The Index: set, reset, rename",
    short: "The Index",
    icon: "Hash",
    keywords: "index set_index reset_index rename reindex sort_index labels multiindex",
    blurb:
      "Promote a column to row labels, and put it back again.",
    context: {
      what: "set_index moves a column into the index; reset_index moves the index back into a column. rename relabels, and sort_index orders rows by their labels.",
      why: "The index is pandas' lookup key: .loc, joins and reshaping all work through it. Choosing a meaningful index turns row lookups into dictionary lookups.",
      how: "df.set_index('name') then df.loc['Priya']. df.reset_index() undoes it. Chain drop=True on reset_index to throw the old index away instead of keeping it.",
    },
    api: ["df.set_index()", "df.reset_index()", "df.rename()", "df.sort_index()", "df.reindex()"],
    keyPoints: [
      "The index does not have to be unique, but duplicates make .loc return multiple rows instead of one.",
      "reset_index() inserts the old index as a column named 'index' (or its own name); reset_index(drop=True) discards it.",
      "rename(columns={...}) relabels columns; rename(index={...}) relabels rows. Both accept a function.",
      "After filtering, the index has holes — 0, 2, 5. That is intentional: it tells you which original rows survived.",
    ],
    gotcha:
      "set_index removes the column from the body of the table. If you still need it as data, use set_index('name', drop=False) or reset_index() afterwards.",
    docs: `${DOCS}pandas.DataFrame.set_index.html`,
    quiz: [
      {
        q: "After df2 = df[df.score > 80], why is df2.index [0, 1, 3]?",
        options: [
          "A bug",
          "The surviving rows keep their original labels",
          "The index was sorted",
          "Filtering always renumbers",
        ],
        answer: 1,
        why: "Filtering selects rows, it does not relabel them. The gaps show which original rows were dropped; reset_index(drop=True) renumbers if you want 0..n.",
      },
      {
        q: "Which call turns the index back into a regular column?",
        options: ["df.set_index()", "df.reset_index()", "df.reindex()", "df.sort_index()"],
        answer: 1,
        why: "reset_index() pushes the index into the table body and installs a fresh 0..n-1 integer index.",
      },
    ],
  },

  copyview: {
    id: "copyview",
    title: "Copy vs View",
    short: "Copy vs View",
    icon: "Copy",
    keywords: "copy view settingwithcopywarning chained assignment inplace slice reference",
    blurb:
      "Why your assignment did not stick — and the warning that tries to tell you.",
    context: {
      what: "Some operations return a view onto the original data; others return a fresh copy. Writing to a view changes the original; writing to a copy changes nothing you keep.",
      why: "This is the source of SettingWithCopyWarning and of the classic 'I set the value but the DataFrame is unchanged' bug. It bites everyone exactly once.",
      how: "Do the selection and the assignment in one .loc call: df.loc[mask, 'col'] = value. When you want an independent table, say so explicitly with .copy().",
    },
    api: ["df.copy()", "df.loc[mask, col] = v", "SettingWithCopyWarning", "inplace="],
    keyPoints: [
      "Chained indexing — df[mask]['col'] = 0 — is two operations. The first may hand you a copy, so the write lands on a temporary.",
      "One combined .loc call, df.loc[mask, 'col'] = 0, always writes to the original.",
      "SettingWithCopyWarning means 'this write may not have done what you expect', not 'this failed'.",
      "sub = df[df.x > 1].copy() makes your intent explicit and silences the warning for good.",
    ],
    gotcha:
      "inplace=True is not a performance win — it usually copies under the hood anyway — and it breaks method chaining. Modern pandas is moving away from it; prefer df = df.op().",
    docs: "https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy",
    quiz: [
      {
        q: "df[df.score < 70]['score'] = 70 raises a warning and changes nothing. Why?",
        options: [
          "score is the wrong dtype",
          "The filter returned a copy, so the write hit a temporary",
          "70 must be a float",
          "You cannot assign to a Series",
        ],
        answer: 1,
        why: "Chained indexing evaluates df[mask] first, which may produce a copy. The second [] then writes into that throwaway object.",
      },
      {
        q: "What is the correct way to write that?",
        options: [
          "df.loc[df.score < 70, 'score'] = 70",
          "df['score'][df.score < 70] = 70",
          "df[df.score < 70].score = 70",
          "df.score.loc[df.score < 70] = 70",
        ],
        answer: 0,
        why: "A single .loc call with both the row mask and the column name targets the original frame in one step.",
      },
    ],
  },

  /* ===================================================================
     CLEANING
     =================================================================== */
  missing: {
    id: "missing",
    title: "Missing Data: fillna & dropna",
    short: "Missing Data",
    icon: "AlertTriangle",
    keywords: "nan null missing fillna dropna isna notna interpolate ffill impute",
    blurb:
      "Detect, fill, or remove NaN — pandas' signal for 'no value here'.",
    context: {
      what: "Missing values show up as NaN (float) or None (object). isna() detects them, fillna() replaces them, dropna() removes the rows or columns that contain them.",
      why: "Raw data is almost never complete. mean, merge and model fitting all treat NaN differently, so you need an explicit policy before you analyse.",
      how: "df.fillna(0) fills everything. df.fillna({'score': df['score'].mean()}) fills per column. df.dropna() drops any row holding a NaN.",
    },
    api: ["df.isna()", "df.notna()", "df.fillna()", "df.dropna()", "s.ffill()", "s.interpolate()"],
    keyPoints: [
      "df.isna().sum() is the standard missing-value report: a count per column.",
      "Aggregations skip NaN by default, so mean() over 5 of 6 values divides by 5, not 6.",
      "dropna(how='any') is the default; how='all' only drops rows that are entirely empty. subset= limits which columns count.",
      "ffill() carries the last valid value forward — right for time series, wrong for unordered rows.",
    ],
    gotcha:
      "NaN != NaN. df[df['score'] == np.nan] always returns zero rows; you have to use df[df['score'].isna()].",
    docs: "https://pandas.pydata.org/docs/user_guide/missing_data.html",
    quiz: [
      {
        q: "A column holds [10, NaN, 20]. What is mean()?",
        options: ["10.0", "15.0", "NaN", "30.0"],
        answer: 1,
        why: "mean() skips NaN by default: (10 + 20) / 2 = 15. Pass skipna=False to get NaN instead.",
      },
      {
        q: "How do you select rows where 'score' is missing?",
        options: [
          "df[df.score == np.nan]",
          "df[df.score.isna()]",
          "df[df.score is None]",
          "df[df.score == 'NaN']",
        ],
        answer: 1,
        why: "NaN is not equal to itself, so == never matches. isna() is the only reliable test.",
      },
    ],
  },

  duplicates: {
    id: "duplicates",
    title: "Duplicate Rows",
    short: "Duplicates",
    icon: "Layers",
    keywords: "duplicated drop_duplicates keep subset unique dedupe distinct",
    blurb:
      "Find repeated rows and decide which copy to keep.",
    context: {
      what: "duplicated() flags rows that have been seen before; drop_duplicates() removes them. subset= restricts the comparison to specific columns.",
      why: "Duplicates arrive from re-run ETL jobs, bad joins and double form submissions, and they silently inflate every count, sum and average you compute.",
      how: "df.duplicated().sum() to measure, df.drop_duplicates() to fix. Use subset=['user_id'] for 'one row per user' and keep='last' to prefer the newest copy.",
    },
    api: ["df.duplicated()", "df.drop_duplicates()", "s.unique()", "s.nunique()", "keep="],
    keyPoints: [
      "By default duplicated() marks every occurrence except the first, so the flag count equals the number of rows you would remove.",
      "keep='first' (default), keep='last', or keep=False to flag every member of a duplicate set, originals included.",
      "subset= defines what 'duplicate' means. Full-row comparison rarely matches real intent.",
      "Sort before dropping when 'which copy' matters: sort_values('updated_at').drop_duplicates('id', keep='last').",
    ],
    gotcha:
      "drop_duplicates() keeps the old index labels, so your row numbers will have gaps. Chain .reset_index(drop=True) if the numbering matters downstream.",
    docs: `${DOCS}pandas.DataFrame.drop_duplicates.html`,
    quiz: [
      {
        q: "Three rows are identical. How many does drop_duplicates() leave?",
        options: ["0", "1", "2", "3"],
        answer: 1,
        why: "The first occurrence is kept and the rest are dropped, leaving one row.",
      },
      {
        q: "What does keep=False do in drop_duplicates()?",
        options: [
          "Keeps nothing",
          "Removes every row that has any duplicate, originals included",
          "Keeps the last copy",
          "Disables the operation",
        ],
        answer: 1,
        why: "keep=False treats all members of a duplicate set as duplicates, so only rows that were unique to begin with survive.",
      },
    ],
  },

  strings: {
    id: "strings",
    title: "String Operations: .str",
    short: "String Ops",
    icon: "Type",
    keywords: "str accessor lower upper contains split replace extract regex strip text",
    blurb:
      "Vectorised string methods through the .str accessor — no loops needed.",
    context: {
      what: "Series.str exposes vectorised versions of Python's string methods: .lower(), .strip(), .contains(), .split(), .replace(), .extract() and more.",
      why: "Text cleaning — casing, stray whitespace, splitting emails into user and domain, pulling fields out with a regex — is a large share of real data work.",
      how: "df['email'].str.split('@').str[1] takes the domain. df['email'].str.contains('scaler') returns a mask you can filter with.",
    },
    api: ["s.str.lower()", "s.str.contains()", "s.str.split()", "s.str.replace()", "s.str.extract()"],
    keyPoints: [
      ".str only exists on object/string Series — reaching for it on a numeric column raises AttributeError.",
      ".str[i] indexes into each value, which is how you pick one piece out of a split result.",
      "contains() and replace() take regex by default. Pass regex=False for a literal match.",
      "NaN propagates through .str methods rather than raising; contains(na=False) is the usual fix before filtering.",
    ],
    gotcha:
      "str.replace() treated its pattern as a regex silently for years. Special characters like . and ( are not literal unless you pass regex=False or escape them.",
    docs: "https://pandas.pydata.org/docs/user_guide/text.html",
    quiz: [
      {
        q: "What does df['email'].str.split('@').str[1] give you?",
        options: ["The username", "The domain", "A list per row", "The whole email"],
        answer: 1,
        why: "split('@') produces a two-element list per row; .str[1] takes the second element — the domain.",
      },
      {
        q: "A column with NaN is filtered with .str.contains('a'). What happens?",
        options: [
          "NaN rows are treated as False",
          "The mask holds NaN and the filter raises",
          "NaN rows are dropped",
          "NaN becomes an empty string",
        ],
        answer: 1,
        why: "contains() returns NaN for missing values, and a mask containing NaN cannot index a frame. Use na=False.",
      },
    ],
  },

  datetime: {
    id: "datetime",
    title: "Dates & Time Series",
    short: "Dates & Time",
    icon: "CalendarClock",
    keywords: "datetime to_datetime dt accessor resample dayofweek timestamp period frequency",
    blurb:
      "Parse timestamps, pull parts out of them, and roll data up by period.",
    context: {
      what: "to_datetime converts strings to datetime64. The .dt accessor exposes year, month, day, hour and dayofweek. resample groups rows by time period the way groupby groups them by key.",
      why: "Dates read from CSV arrive as strings, where sorting and subtraction are meaningless. Converting them unlocks the whole time-series toolkit.",
      how: "df['ts'] = pd.to_datetime(df['ts']), then df['ts'].dt.month. Set the datetime as the index and df.resample('D').sum() aggregates per day.",
    },
    api: ["pd.to_datetime()", "s.dt.year", "s.dt.dayofweek", "df.resample()", "pd.date_range()"],
    keyPoints: [
      "A datetime64 column supports subtraction, giving a timedelta you can convert with .dt.days.",
      ".dt is to datetimes what .str is to strings — an accessor that only exists on the right dtype.",
      "resample() needs a DatetimeIndex, so set_index('ts') comes first. 'D' is daily, 'W' weekly, 'ME' month-end.",
      "Date strings sort correctly only in ISO form (YYYY-MM-DD). '01/03/2025' sorts as text, not as time.",
    ],
    gotcha:
      "Ambiguous formats like 03/04/2025 are parsed US-style (March 4) by default. Pass an explicit format= or dayfirst=True, and keep errors='coerce' handy for dirty columns.",
    docs: "https://pandas.pydata.org/docs/user_guide/timeseries.html",
    quiz: [
      {
        q: "Which dtype does a parsed timestamp column have?",
        options: ["object", "datetime64[ns]", "int64", "category"],
        answer: 1,
        why: "to_datetime produces datetime64[ns] — nanosecond-resolution timestamps stored as 64-bit integers.",
      },
      {
        q: "What does df.resample('D') require?",
        options: [
          "A sorted frame",
          "A DatetimeIndex",
          "A column named 'date'",
          "No missing values",
        ],
        answer: 1,
        why: "resample groups along a time axis, so the time information has to be in the index (or named via on=).",
      },
    ],
  },

  /* ===================================================================
     TRANSFORMING
     =================================================================== */
  columns: {
    id: "columns",
    title: "Adding & Dropping Columns",
    short: "Column Surgery",
    icon: "Columns3",
    keywords: "add column drop rename assign insert derived computed vectorised arithmetic",
    blurb:
      "Derive new columns from old ones, and remove what you no longer need.",
    context: {
      what: "A new column is created by assigning to a name that does not exist yet. Columns are removed with drop(columns=[...]) and renamed with rename(columns={...}).",
      why: "Feature engineering is mostly this: ratios, flags, buckets and differences built out of existing columns. Doing it with vectorised arithmetic keeps it fast and readable.",
      how: "df['per_attempt'] = df['score'] / df['attempts'] computes on whole columns at once. assign() does the same inside a method chain.",
    },
    api: ["df['new'] = ...", "df.assign()", "df.drop(columns=)", "df.rename(columns=)", "df.insert()"],
    keyPoints: [
      "Column arithmetic is element-wise and aligns on the index, so the operands must share an index.",
      "assign() returns a new frame, which makes it the chain-friendly way to add columns.",
      "drop needs to know the axis: drop(columns=['a']) or drop('a', axis=1). Bare drop('a') removes a row.",
      "New columns land at the right-hand end; insert(loc, name, values) puts one at a chosen position.",
    ],
    gotcha:
      "df.new_col = values does not create a column — it quietly sets a Python attribute on the object. Always assign with brackets: df['new_col'] = values.",
    docs: "https://pandas.pydata.org/docs/user_guide/dsintro.html#column-selection-addition-deletion",
    quiz: [
      {
        q: "df['ratio'] = df['a'] / df['b'] — how many divisions does Python perform?",
        options: [
          "One per row, in a Python loop",
          "One vectorised operation in C",
          "None until the column is read",
          "One per column",
        ],
        answer: 1,
        why: "Series arithmetic hands the whole array to NumPy, which divides element-wise in compiled code — no Python-level loop.",
      },
      {
        q: "Which call removes the 'temp' column?",
        options: ["df.drop('temp')", "df.drop(columns=['temp'])", "del df.temp", "df.remove('temp')"],
        answer: 1,
        why: "drop defaults to axis=0 (rows), so a column needs columns= or axis=1.",
      },
    ],
  },

  apply: {
    id: "apply",
    title: "Apply, Map & Vectorising",
    short: "Apply & Map",
    icon: "FunctionSquare",
    keywords: "apply map applymap lambda axis function vectorise np.where cut performance",
    blurb:
      "Run your own Python function over a Series or DataFrame — and know when not to.",
    context: {
      what: "Series.apply(f) runs f once per value. DataFrame.apply(f, axis=1) runs f once per row. map() is a Series-only shortcut for value lookup or transformation.",
      why: "When the logic you need is not a built-in aggregation, apply is the escape hatch — derived columns, bucketing, awkward per-row rules.",
      how: "df['grade'] = df['score'].apply(lambda s: 'A' if s >= 90 else 'B'). Row-wise: df.apply(lambda r: r['score'] * r['attempts'], axis=1).",
    },
    api: ["s.apply()", "s.map()", "df.apply(axis=1)", "np.where()", "pd.cut()"],
    keyPoints: [
      "apply is a Python-level loop in disguise. It is flexible but 10–100× slower than the vectorised equivalent.",
      "axis=0 (default) passes each column to f; axis=1 passes each row as a Series.",
      "map() also accepts a dict, which makes it the cleanest way to recode categories.",
      "Before reaching for apply, look for a vectorised form: np.where for if/else, pd.cut for bucketing, .str for text.",
    ],
    gotcha:
      "df.apply(f, axis=1) hands f a Series per row, so every row build costs object overhead. On a million rows that difference is minutes versus milliseconds.",
    docs: `${DOCS}pandas.DataFrame.apply.html`,
    quiz: [
      {
        q: "What does axis=1 mean in df.apply(f, axis=1)?",
        options: [
          "f receives each column",
          "f receives each row",
          "f runs once",
          "f receives the index",
        ],
        answer: 1,
        why: "axis=1 applies the function across the columns — that is, once per row, with the row handed over as a Series.",
      },
      {
        q: "Which is the fastest way to build a two-way flag column?",
        options: [
          "apply with a lambda",
          "np.where(cond, 'yes', 'no')",
          "A for loop over iterrows",
          "map with a function",
        ],
        answer: 1,
        why: "np.where is fully vectorised in C. Both apply and iterrows run Python code per row.",
      },
    ],
  },

  sorting: {
    id: "sorting",
    title: "Sorting & Ranking",
    short: "Sorting & Ranking",
    icon: "ArrowUpDown",
    keywords: "sort_values sort_index ascending rank nlargest nsmallest top ties order",
    blurb:
      "Reorder rows by one or more columns, and turn order into a rank.",
    context: {
      what: "sort_values reorders rows by the values in one or more columns. rank() converts the ordering into numbers, and nlargest/nsmallest grab the extremes directly.",
      why: "Before you display, aggregate or export, you usually want rows in a meaningful order. Stable multi-column sorting lets you break ties predictably.",
      how: "df.sort_values('score', ascending=False). Multi-column: df.sort_values(['batch', 'score'], ascending=[True, False]).",
    },
    api: ["df.sort_values()", "df.sort_index()", "s.rank()", "df.nlargest()", "df.nsmallest()"],
    keyPoints: [
      "The index travels with its row. Sorting scrambles the index order; it does not renumber.",
      "With a list of columns, sorting is hierarchical: ties in the first column are broken by the second.",
      "na_position='first' moves NaN to the top; by default missing values sink to the bottom either way.",
      "nlargest(3, 'score') beats sort_values().head(3) — it is one pass instead of a full sort.",
    ],
    gotcha:
      "sort_values returns a new frame. Forgetting to reassign — writing df.sort_values('score') on its own line — leaves df untouched.",
    docs: `${DOCS}pandas.DataFrame.sort_values.html`,
    quiz: [
      {
        q: "What does ascending=[True, False] do with by=['batch','score']?",
        options: [
          "batch A→Z, then score high→low within each batch",
          "batch Z→A, then score low→high",
          "It raises",
          "Only batch is sorted",
        ],
        answer: 0,
        why: "The booleans line up with the column list positionally: first key ascending, second key descending.",
      },
      {
        q: "After sorting, what is df.loc[0]?",
        options: [
          "The first row of the sorted frame",
          "The row still labelled 0, wherever it now sits",
          "A KeyError",
          "The largest value",
        ],
        answer: 1,
        why: ".loc works on labels, and labels do not change when rows move. The first row of the result is df.iloc[0].",
      },
    ],
  },

  window: {
    id: "window",
    title: "Shift, Diff & Rolling",
    short: "Window Functions",
    icon: "Waves",
    keywords: "shift diff cumsum cumulative rolling window moving average expanding pct_change",
    blurb:
      "Compare each row with its neighbours: lags, deltas, running totals, moving averages.",
    context: {
      what: "shift moves a column up or down by n rows, diff subtracts the shifted copy, cumsum accumulates, and rolling(n) computes over a sliding window of n rows.",
      why: "Growth, deltas, running totals and smoothed trends all need a row to see its neighbours — something plain column arithmetic cannot do.",
      how: "df['prev'] = df['sales'].shift(1); df['delta'] = df['sales'].diff(); df['ma3'] = df['sales'].rolling(3).mean().",
    },
    api: ["s.shift()", "s.diff()", "s.cumsum()", "s.rolling()", "s.pct_change()", "s.expanding()"],
    keyPoints: [
      "shift(1) introduces a NaN at the top; shift(-1) puts one at the bottom. The column length never changes.",
      "diff() is exactly s - s.shift(1), so its first value is always NaN.",
      "rolling(3).mean() leaves the first two rows NaN because a 3-row window is not yet full.",
      "Sort the rows before windowing. shift and rolling follow row order, not time, and will happily lag the wrong neighbour.",
    ],
    gotcha:
      "Mixing grouped data into a window silently leaks values across groups. Use df.groupby('key')['x'].shift(1) so each group's window starts fresh.",
    docs: "https://pandas.pydata.org/docs/user_guide/window.html",
    quiz: [
      {
        q: "A 6-row column goes through rolling(3).mean(). How many NaN values are at the top?",
        options: ["0", "1", "2", "3"],
        answer: 2,
        why: "Rows 0 and 1 cannot fill a 3-wide window, so both are NaN; row 2 is the first complete window.",
      },
      {
        q: "What is s.diff() equivalent to?",
        options: ["s - s.mean()", "s - s.shift(1)", "s.cumsum()", "s / s.shift(1)"],
        answer: 1,
        why: "diff subtracts each value's predecessor — the shifted copy — which is why the first entry is NaN.",
      },
    ],
  },

  /* ===================================================================
     AGGREGATING
     =================================================================== */
  groupby: {
    id: "groupby",
    title: "GroupBy: Split · Apply · Combine",
    short: "GroupBy",
    icon: "Group",
    keywords: "groupby split apply combine aggregate mean sum per category lazy",
    blurb:
      "Split rows into buckets, compute something per bucket, combine into one result.",
    context: {
      what: "groupby partitions rows into groups by a key. You then apply an aggregation (mean, sum, count, …) to each group, and pandas combines the results into one object.",
      why: "Almost every analytics question — average score per batch, revenue per region, count per category — is a groupby question.",
      how: "df.groupby('batch')['score'].mean(). The groupby object is lazy; the aggregation is what triggers computation.",
    },
    api: ["df.groupby()", "g.mean()", "g.size()", "g.agg()", "as_index=", "dropna="],
    keyPoints: [
      "Split · apply · combine is the whole model. Picture the frame cut into mini-frames, each reduced to one row.",
      "The group key becomes the index of the result. as_index=False keeps it as an ordinary column.",
      "size() counts rows per group including NaN; count() counts non-null values per column.",
      "Grouping by several keys gives a MultiIndex — one level per key.",
    ],
    gotcha:
      "Rows whose group key is NaN are dropped silently. If missing keys are meaningful, pass dropna=False or you will lose rows with no warning.",
    docs: "https://pandas.pydata.org/docs/user_guide/groupby.html",
    quiz: [
      {
        q: "What does df.groupby('batch') compute?",
        options: [
          "The mean per batch",
          "Nothing yet — it is lazy",
          "A sorted frame",
          "A list of batches",
        ],
        answer: 1,
        why: "groupby only records the partition. Work happens when you call an aggregation on the GroupBy object.",
      },
      {
        q: "Where does the group key end up after df.groupby('batch')['score'].mean()?",
        options: ["In a column named batch", "In the index", "It is dropped", "In the column headers"],
        answer: 1,
        why: "The keys become the index of the result. Use as_index=False to get them back as a column instead.",
      },
    ],
  },

  aggregate: {
    id: "aggregate",
    title: "agg, transform & filter",
    short: "agg & transform",
    icon: "Sigma",
    keywords: "agg aggregate transform filter named aggregation multiple metrics broadcast group",
    blurb:
      "Three different shapes of answer from the same groups.",
    context: {
      what: "agg reduces each group to one row. transform returns a value per original row, broadcast back from the group. filter keeps or drops whole groups.",
      why: "The three cover different questions: 'what is the average per batch' (agg), 'how far is this student from their batch average' (transform), 'drop batches with fewer than 3 students' (filter).",
      how: "g.agg(avg=('score','mean')) for named metrics, g['score'].transform('mean') for a same-length column, g.filter(lambda d: len(d) >= 3) for group-level selection.",
    },
    api: ["g.agg()", "g.transform()", "g.filter()", "named aggregation", "g.apply()"],
    keyPoints: [
      "agg output has one row per group. transform output has one row per original row. That shape difference is the whole point.",
      "Named aggregation — out=(column, func) — produces flat, readable column names instead of a MultiIndex.",
      "transform is how you compute group-relative values: df['score'] - g['score'].transform('mean').",
      "filter takes a function of the whole sub-frame returning True/False, and keeps every row of the groups that pass.",
    ],
    gotcha:
      "agg(['mean','sum']) over several columns produces a MultiIndex on the columns, which then needs flattening. Named aggregation sidesteps that entirely.",
    docs: "https://pandas.pydata.org/docs/user_guide/groupby.html#aggregation",
    quiz: [
      {
        q: "6 rows across 2 groups. How many rows does g['score'].transform('mean') return?",
        options: ["2", "6", "1", "12"],
        answer: 1,
        why: "transform broadcasts each group's result back over its rows, so the output always matches the input length — handy for assigning straight back as a column.",
      },
      {
        q: "Which one drops whole groups?",
        options: ["agg", "transform", "filter", "size"],
        answer: 2,
        why: "filter evaluates a predicate per group and keeps all rows of the groups that pass, discarding the rest.",
      },
    ],
  },

  valuecounts: {
    id: "valuecounts",
    title: "Counting & Frequencies",
    short: "Counting Values",
    icon: "ListOrdered",
    keywords: "value_counts unique nunique crosstab normalize frequency distribution mode bins",
    blurb:
      "How often does each value occur — and how do two columns cross?",
    context: {
      what: "value_counts() tallies occurrences per distinct value, unique()/nunique() list and count the distinct values, and crosstab() builds a frequency table across two columns.",
      why: "Frequency is the first question you ask of any categorical column: what are the categories, how skewed are they, are there typos hiding in the long tail?",
      how: "df['batch'].value_counts(), then normalize=True for shares. pd.crosstab(df['batch'], df['passed']) for a contingency table.",
    },
    api: ["s.value_counts()", "s.unique()", "s.nunique()", "pd.crosstab()", "s.mode()"],
    keyPoints: [
      "value_counts() sorts by frequency descending and drops NaN — pass dropna=False to see missing values as a category.",
      "normalize=True converts the counts to proportions that sum to 1.",
      "bins=5 buckets a numeric column before counting, which turns value_counts into a quick histogram.",
      "crosstab is a pivot_table with aggfunc='count' and a friendlier signature for two-way frequencies.",
    ],
    gotcha:
      "value_counts() returns a Series indexed by the values, not a tidy two-column frame. Chain .reset_index() when you need columns to merge or plot from.",
    docs: `${DOCS}pandas.Series.value_counts.html`,
    quiz: [
      {
        q: "What does value_counts(normalize=True) return?",
        options: ["Counts", "Proportions summing to 1", "Percentages 0–100", "Sorted values"],
        answer: 1,
        why: "normalize divides each count by the total, giving shares. Multiply by 100 yourself if you want percentages.",
      },
      {
        q: "Which one tabulates two columns against each other?",
        options: ["value_counts", "nunique", "pd.crosstab", "describe"],
        answer: 2,
        why: "crosstab takes a row key and a column key and counts the co-occurrences in a matrix.",
      },
    ],
  },

  /* ===================================================================
     COMBINING & RESHAPING
     =================================================================== */
  merge: {
    id: "merge",
    title: "Merge: Joining Two Tables",
    short: "Merge & Join",
    icon: "GitMerge",
    keywords: "merge join inner left right outer on key how suffixes sql relational",
    blurb:
      "Combine two tables on a shared key — inner, left, right or outer.",
    context: {
      what: "merge matches rows from two DataFrames wherever a shared key is equal, producing a wider table with columns from both.",
      why: "Real data lives in several tables: orders reference users, users reference plans. Merging is how you answer questions that span them.",
      how: "pd.merge(left, right, on='user_id', how='inner'). how decides what happens to unmatched rows — inner drops them, left/right/outer keep them with NaN.",
    },
    api: ["pd.merge()", "how=", "on=", "left_on=/right_on=", "suffixes=", "indicator="],
    keyPoints: [
      "inner keeps only matched keys, left keeps every left row, right every right row, outer the union of both.",
      "Unmatched rows are padded with NaN, which can quietly promote an int column to float.",
      "If the key column has duplicates on both sides, the result is their cross product — a classic source of row explosions.",
      "indicator=True adds a _merge column saying where each row came from. It is the fastest way to debug a join.",
    ],
    gotcha:
      "Always check the row count after a merge. More rows than you started with means duplicate keys; far fewer means your keys did not match — often a dtype or whitespace mismatch.",
    docs: "https://pandas.pydata.org/docs/user_guide/merging.html",
    quiz: [
      {
        q: "A left row has no match in the right table with how='left'. What appears in the right-hand columns?",
        options: ["0", "NaN", "The row is dropped", "An error"],
        answer: 1,
        why: "A left join keeps every left row and pads the missing right-hand values with NaN.",
      },
      {
        q: "A key appears twice on the left and three times on the right. How many result rows carry it?",
        options: ["2", "3", "5", "6"],
        answer: 3,
        why: "Matching is a cross product per key: 2 × 3 = 6 rows. This is how merges accidentally multiply data.",
      },
    ],
  },

  concat: {
    id: "concat",
    title: "Concat: Stacking Tables",
    short: "Concat",
    icon: "Combine",
    keywords: "concat append axis ignore_index join stack vertical horizontal union",
    blurb:
      "Glue frames together end-to-end or side-by-side.",
    context: {
      what: "pd.concat([a, b]) stacks frames vertically (axis=0) or joins them side-by-side (axis=1). It aligns on the other axis's labels.",
      why: "Monthly files, paginated API pages and per-city exports all need to become one table. concat is the tool — merge is for matching keys, concat is for appending.",
      how: "pd.concat([jan, feb], ignore_index=True) for rows. pd.concat([left, right], axis=1) for columns. join='inner' keeps only shared labels.",
    },
    api: ["pd.concat()", "axis=", "ignore_index=", "join=", "keys="],
    keyPoints: [
      "Vertical concat aligns on column names: a column missing from one frame becomes NaN, not an error.",
      "ignore_index=True renumbers the result 0..n-1, which is almost always what you want when stacking rows.",
      "Horizontal concat (axis=1) aligns on the index. Mismatched indexes produce NaN, not a positional zip.",
      "keys=['jan','feb'] labels where each block came from, creating a MultiIndex you can group on later.",
    ],
    gotcha:
      "Without ignore_index=True, stacking frames duplicates index labels — so df.loc[0] returns several rows and later joins misbehave.",
    docs: "https://pandas.pydata.org/docs/user_guide/merging.html#concatenating-objects",
    quiz: [
      {
        q: "Two frames are concatenated with axis=0. One has an extra column. What happens?",
        options: [
          "It raises",
          "The extra column is filled with NaN for the other frame's rows",
          "The column is dropped",
          "The frames are joined on it",
        ],
        answer: 1,
        why: "concat takes the union of columns by default (join='outer') and pads the gaps with NaN.",
      },
      {
        q: "Which argument renumbers the index after stacking?",
        options: ["reset=True", "ignore_index=True", "axis=1", "join='inner'"],
        answer: 1,
        why: "ignore_index=True discards both frames' labels and builds a fresh 0..n-1 index.",
      },
    ],
  },

  pivot: {
    id: "pivot",
    title: "Pivot & Melt: Reshape",
    short: "Pivot & Melt",
    icon: "ArrowLeftRight",
    keywords: "pivot melt pivot_table wide long reshape tidy unpivot index columns values",
    blurb:
      "Switch between long format (one row per observation) and wide format.",
    context: {
      what: "pivot turns a long table wide: row values become column headers. melt does the inverse, collapsing many columns back into rows.",
      why: "Analysts read wide tables; storage and ETL prefer long ones. You move between the two constantly, and pivot_table adds aggregation for duplicate keys.",
      how: "df.pivot(index='region', columns='month', values='revenue') builds a matrix. df.melt(id_vars=['region']) collapses it back.",
    },
    api: ["df.pivot()", "df.pivot_table()", "df.melt()", "aggfunc=", "fill_value="],
    keyPoints: [
      "pivot needs index/columns pairs to be unique; duplicates raise ValueError.",
      "pivot_table is pivot plus aggregation — it averages duplicates by default (aggfunc='mean').",
      "melt's id_vars stay as columns; everything else is folded into 'variable' and 'value' columns.",
      "Long format is the right shape for groupby and for most plotting libraries; wide format is for human eyes.",
    ],
    gotcha:
      "'Index contains duplicate entries, cannot reshape' means the index/columns pair repeats. Switch to pivot_table and pick an aggfunc, which is the decision pivot cannot make for you.",
    docs: "https://pandas.pydata.org/docs/user_guide/reshaping.html",
    quiz: [
      {
        q: "A long table has 2 regions × 3 months. What shape does pivot(index='region', columns='month') give?",
        options: ["6 × 1", "2 × 3", "3 × 2", "6 × 3"],
        answer: 1,
        why: "Regions become the two rows and months the three columns — the 6 observations are rearranged into a 2 × 3 matrix.",
      },
      {
        q: "pivot raises 'duplicate entries'. What is the fix?",
        options: [
          "Sort first",
          "Use pivot_table with an aggfunc",
          "Reset the index",
          "Drop the columns argument",
        ],
        answer: 1,
        why: "Duplicates mean several values compete for one cell. pivot_table asks you how to combine them.",
      },
    ],
  },

  stack: {
    id: "stack",
    title: "Stack, Unstack & MultiIndex",
    short: "Stack & MultiIndex",
    icon: "Boxes",
    keywords: "stack unstack multiindex hierarchical levels swaplevel droplevel xs reshape",
    blurb:
      "Move labels between the rows and the columns of a hierarchical table.",
    context: {
      what: "A MultiIndex has several levels per axis. stack pushes the innermost column level down into the index; unstack pulls the innermost index level up into the columns.",
      why: "Grouping by two keys produces a MultiIndex, so every multi-key aggregation lands you here. stack/unstack is how you turn that result into the table you actually want.",
      how: "g = df.groupby(['batch','passed'])['score'].mean() gives a 2-level Series. g.unstack() spreads the last level across columns.",
    },
    api: ["df.stack()", "df.unstack()", "df.xs()", "df.swaplevel()", "df.droplevel()"],
    keyPoints: [
      "stack and unstack are exact inverses: stack makes a table taller and narrower, unstack wider and shorter.",
      "unstack(level=0) chooses which index level moves up; the default -1 is the innermost.",
      "Select from a MultiIndex with tuples — df.loc[('DSML', True)] — or with .xs('DSML', level='batch').",
      "reset_index() flattens a MultiIndex back into ordinary columns, which is usually the easiest next step.",
    ],
    gotcha:
      "stack() drops missing combinations by default, so a round trip through stack().unstack() can silently lose empty cells. Pass dropna=False to keep them.",
    docs: "https://pandas.pydata.org/docs/user_guide/reshaping.html#reshaping-by-stacking-and-unstacking",
    quiz: [
      {
        q: "A Series has a 2-level index. What does unstack() do?",
        options: [
          "Moves the inner level into the columns, giving a DataFrame",
          "Sorts the index",
          "Drops a level",
          "Flattens to a list",
        ],
        answer: 0,
        why: "unstack lifts the innermost index level onto the column axis, so a 2-level Series becomes a 2-D frame.",
      },
      {
        q: "How do you select one value from a 2-level MultiIndex?",
        options: ["df.loc['DSML', True]", "df.loc[('DSML', True)]", "Both work", "Neither"],
        answer: 2,
        why: "A tuple is the explicit form, and .loc also accepts the levels as positional arguments. The tuple is clearer and avoids ambiguity with column selection.",
      },
    ],
  },

  /* ===================================================================
     REFERENCE
     =================================================================== */
  cheatsheet: {
    id: "cheatsheet",
    title: "Cheat Sheet",
    short: "Cheat Sheet",
    icon: "BookOpen",
    keywords: "cheatsheet reference summary quick syntax all methods",
    blurb: "Every operation in this app, on one page, grouped by task.",
    context: {
      what: "A compact reference of the pandas calls covered across these lessons, grouped by the job you are trying to do.",
      why: "Once the mental model is in place, what you need is recall, not explanation. This page is for the moment you know what you want and just need the syntax.",
      how: "Skim by task heading, or use the search box to narrow down. Click any lesson chip to revisit the animation behind it.",
    },
  },

  pitfalls: {
    id: "pitfalls",
    title: "Classic Pitfalls",
    short: "Classic Pitfalls",
    icon: "Lightbulb",
    keywords: "gotchas pitfalls mistakes errors warnings common bugs debugging",
    blurb: "The mistakes that catch everyone, collected in one place.",
    context: {
      what: "The gotcha from every lesson, gathered together with the fix for each.",
      why: "Most pandas debugging sessions end at one of a dozen or so recurring traps. Seeing them as a set makes them recognisable the next time.",
      how: "Read through once now and once after you have written some pandas of your own — the second pass is when they land.",
    },
  },
};

export const PAGE_ORDER: PageId[] = [...LESSON_IDS];

export const PAGE_SECTIONS: Array<{ label: string; pages: PageId[] }> = [
  { label: "Foundations", pages: ["overview", "create", "inspect", "series", "dtypes"] },
  { label: "Selecting Data", pages: ["selection", "filtering", "query", "indexing", "copyview"] },
  { label: "Cleaning", pages: ["missing", "duplicates", "strings", "datetime"] },
  { label: "Transforming", pages: ["columns", "apply", "sorting", "window"] },
  { label: "Aggregating", pages: ["groupby", "aggregate", "valuecounts"] },
  { label: "Combining & Reshaping", pages: ["merge", "concat", "pivot", "stack"] },
  { label: "Reference", pages: ["cheatsheet", "pitfalls"] },
];

/** Which section a lesson belongs to — used by the palette and the footer. */
export function sectionOf(id: PageId): string {
  return PAGE_SECTIONS.find((s) => s.pages.includes(id))?.label ?? "";
}

export function neighbours(id: PageId): { prev?: PageId; next?: PageId } {
  const i = PAGE_ORDER.indexOf(id);
  return {
    prev: i > 0 ? PAGE_ORDER[i - 1] : undefined,
    next: i < PAGE_ORDER.length - 1 ? PAGE_ORDER[i + 1] : undefined,
  };
}

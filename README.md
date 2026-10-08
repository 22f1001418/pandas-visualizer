# Pandas Visualizer · by KM

An interactive, step-by-step visualizer for learning **pandas**. Every operation
is animated on a real DataFrame: you press play, and watch rows get filtered,
split into groups, joined, reshaped and aggregated — with the matching line of
code highlighted as it runs.

Built as a teaching tool: 25 lessons plus 2 reference pages, covering general
pandas from `pd.DataFrame(...)` through to `stack`/`unstack` and MultiIndex.

---

## What's in it

**Foundations** — DataFrames & Series · Creating & Loading Data · Inspecting a
DataFrame · Series (the 1-D object) · Dtypes & type conversion

**Selecting Data** — `.loc` and `.iloc` · Boolean filtering · `isin`, `between`
& `query` · The index (`set_index`/`reset_index`/`rename`) · Copy vs view

**Cleaning** — Missing data (`fillna`/`dropna`) · Duplicate rows · String
operations (`.str`) · Dates & time series

**Transforming** — Adding & dropping columns · `apply`, `map` & vectorising ·
Sorting & ranking · Shift, diff & rolling windows

**Aggregating** — GroupBy (split · apply · combine) · `agg`, `transform` &
`filter` · Counting & frequencies

**Combining & Reshaping** — Merge/join (with a live `how=` switch) · Concat ·
Pivot & melt · Stack, unstack & MultiIndex

**Reference** — A searchable cheat sheet, and every lesson's classic mistake
collected on one Pitfalls page.

Each lesson carries a What/Why/How framing, an animated walkthrough, the
classic mistake for that topic, a takeaway list, and two self-check questions.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # -> dist/
npm run preview
npm run typecheck
```

## Using it

| Key | Action |
| --- | --- |
| `←` `→` | Previous / next step |
| `space` | Play / pause the animation |
| `⌘K` / `Ctrl+K` / `/` | Search every lesson |
| `t` | Toggle light / dark |

Each lesson has its own URL (`#/groupby`, `#/merge`, …), so you can link
straight to a topic from a slide or a message. The step rail under the output
jumps to any step directly, and playback speed is adjustable (0.5× / 1× / 2×).

## How it works

**The operations are simulated, not executed.** There is no Python in the
browser. Each lesson is a hand-authored array of `Step` objects, and a small
DataFrame engine in `src/lib/dataframe.ts` computes the actual results — means,
joins, sorts, rolling windows — so the numbers on screen are derived from the
data rather than typed in by hand. That keeps the bundle small and the
animations exactly as tight as a lesson needs.

**Animation** is FLIP via Framer Motion's `layout`. Rows are keyed by index
label, so when a sort or a filter moves a row, the DOM element travels to its
new position instead of being torn down and rebuilt. That is what makes a sort
readable: you can follow one student's row as it moves.

**Code highlighting** is content-addressed. A step names a fragment of the line
it executes (`L.at('df.groupby("batch")')`) rather than a line number, so
editing a listing cannot silently desynchronise the highlighting. In dev, a
fragment that matches nothing logs a warning.

**Lessons are code-split** — each one is a separate lazily-imported chunk, so
the initial load carries the shell plus one lesson (~112 kB gzipped total).

## Project structure

```
src/
├── components/
│   ├── AnimationControls.tsx   play/pause · scrubber · speed
│   ├── Callout.tsx             tone-coded note boxes
│   ├── CodeCell.tsx            notebook cell with per-line highlighting
│   ├── CommandPalette.tsx      ⌘K lesson search
│   ├── DataFrameView.tsx       the animated table renderer
│   ├── Inspector.tsx           right rail — what this step is doing
│   ├── KeyPoints.tsx           takeaway list
│   ├── LessonNav.tsx           prev/next lesson
│   ├── PageShell.tsx           What/Why/How + gotcha + quiz + nav
│   ├── Quiz.tsx                self-check questions
│   ├── Segmented.tsx           variant picker (e.g. join type)
│   ├── Sidebar.tsx             sections + filter
│   ├── StepRunner.tsx          the engine of every lesson page
│   └── TopBar.tsx              breadcrumb · search · theme
├── data/samples.ts             the teaching datasets
├── lib/
│   ├── code.ts                 content-addressed line lookup
│   ├── dataframe.ts            the mini DataFrame engine
│   └── icons.ts                explicit icon map (keeps lucide tree-shaken)
├── pages/                      one file per lesson + registry.ts
├── store/useStore.ts           page · theme · sidebar · palette · speed
├── types/index.ts              DataFrame, Step, FrameView, PageMeta, Quiz
└── index.css                   theme tokens + component classes
```

`src/pages/registry.ts` is the single source of truth: the sidebar, the command
palette, the router, the prev/next footer and the Pitfalls page all read from
it. **To add a lesson**, add its id to `LESSON_IDS`, its metadata to `PAGES`,
its id to a section in `PAGE_SECTIONS`, and its component to `LESSON_COMPONENTS`
in `App.tsx`.

## Tech

React 18 · TypeScript 5.6 · Vite 6 · Tailwind 3.4 + CSS custom properties ·
Framer Motion 11 · Zustand 5 · prism-react-renderer · lucide-react

## Deploying

Any static host. The build output is `dist/`, there is no server component, and
routing is hash-based so no rewrite rules are required.

- **Render / Netlify** — build `npm install && npm run build`, publish `dist`
  (`public/_redirects` is already in place)
- **GitHub Pages** — publish `dist`; set `base` in `vite.config.ts` to
  `/<repo-name>/` if it is not served from the domain root

---

Built for students. © KM

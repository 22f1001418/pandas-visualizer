import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Callout } from "./Callout";
import { KeyPoints } from "./KeyPoints";
import { LessonNav } from "./LessonNav";
import { Quiz } from "./Quiz";
import { getIcon } from "@/lib/icons";
import type { PageId } from "@/pages/registry";
import { sectionOf } from "@/pages/registry";
import type { PageMeta } from "@/types";

interface Props {
  meta: PageMeta;
  children: ReactNode;
}

/**
 * Every lesson page is wrapped in this shell, which supplies the parts that
 * should never vary: the What/Why/How framing up top, and the gotcha,
 * takeaways, quiz and prev/next footer underneath. A page body only has to
 * provide its animation.
 */
export function PageShell({ meta, children }: Props) {
  const Icon = getIcon(meta.icon);

  return (
    <motion.div
      key={meta.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="page"
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="page__icon">
            <Icon size={20} strokeWidth={2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="page__kicker">{sectionOf(meta.id as PageId)}</span>
            <h1 className="page__title">{meta.title}</h1>
          </div>
        </div>
        <p className="page__blurb">{meta.blurb}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
          <ContextBox label="What" tone="accent" body={meta.context.what} />
          <ContextBox label="Why" tone="pink" body={meta.context.why} />
          <ContextBox label="How" tone="neutral" body={meta.context.how} />
        </div>

        {meta.api && meta.api.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fg-subtle mr-1">
              Covered
            </span>
            {meta.api.map((a) => (
              <code key={a} className="api-chip">
                {a}
              </code>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-col gap-5">{children}</div>

      {meta.gotcha && (
        <Callout tone="warning" label="The classic mistake">
          {meta.gotcha}
        </Callout>
      )}

      {meta.keyPoints && meta.keyPoints.length > 0 && (
        <KeyPoints points={meta.keyPoints} />
      )}

      {meta.quiz && meta.quiz.length > 0 && <Quiz items={meta.quiz} />}

      <LessonNav id={meta.id as PageId} />
    </motion.div>
  );
}

function ContextBox({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone: "accent" | "pink" | "neutral";
}) {
  const color =
    tone === "accent"
      ? "var(--accent)"
      : tone === "pink"
        ? "var(--pink)"
        : "var(--fg-muted)";
  return (
    <div className="card p-3.5 flex flex-col gap-1.5">
      <span
        className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color }}
      >
        {label}
      </span>
      <p className="text-[13px] leading-relaxed text-fg">{body}</p>
    </div>
  );
}

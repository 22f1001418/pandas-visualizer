import { useState } from "react";
import { motion } from "framer-motion";
import { getIcon } from "@/lib/icons";
import type { QuizItem } from "@/types";

interface Props {
  items: QuizItem[];
}

/**
 * Self-check questions at the foot of a lesson.
 *
 * Answering reveals the explanation whether you were right or wrong — the
 * explanation is the point, the score is not.
 */
export function Quiz({ items }: Props) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const Check = getIcon("ChevronRight");
  const Help = getIcon("CircleHelp");

  const answered = Object.keys(picked).length;
  const correct = items.filter((it, i) => picked[i] === it.answer).length;

  return (
    <section className="card p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Help size={15} className="text-accent" />
        <h2 className="section-title !pb-0">Check yourself</h2>
        {answered > 0 && (
          <span className="ml-auto chip chip-accent">
            {correct} / {items.length} right
          </span>
        )}
      </div>

      {items.map((item, qi) => {
        const choice = picked[qi];
        const done = choice !== undefined;
        return (
          <div key={item.q} className="flex flex-col gap-2">
            <p className="text-[13.5px] font-medium text-fg leading-snug">
              <span className="text-fg-subtle font-mono mr-1.5">
                {qi + 1}.
              </span>
              {item.q}
            </p>

            <div className="grid gap-1.5">
              {item.options.map((opt, oi) => {
                const isPicked = choice === oi;
                const isAnswer = item.answer === oi;
                const state = !done
                  ? ""
                  : isAnswer
                    ? "quiz__opt--right"
                    : isPicked
                      ? "quiz__opt--wrong"
                      : "quiz__opt--muted";
                return (
                  <button
                    key={opt}
                    disabled={done}
                    className={`quiz__opt ${state}`}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                  >
                    <span className="quiz__marker">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1 text-left">{opt}</span>
                    {done && isAnswer && <Check size={13} />}
                  </button>
                );
              })}
            </div>

            {done && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="quiz__why"
              >
                {item.why}
              </motion.p>
            )}
          </div>
        );
      })}
    </section>
  );
}

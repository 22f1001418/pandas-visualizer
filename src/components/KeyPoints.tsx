import { getIcon } from "@/lib/icons";

interface Props {
  points: string[];
  title?: string;
}

/** The takeaway list at the foot of a lesson. */
export function KeyPoints({ points, title = "What to remember" }: Props) {
  const Check = getIcon("ArrowRight");
  return (
    <section className="card p-4 flex flex-col gap-3">
      <h2 className="section-title">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 items-start">
            <span className="keypoint__bullet">
              <Check size={12} strokeWidth={2.5} />
            </span>
            <span className="text-[13.5px] leading-relaxed text-fg">{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { Highlight, themes } from "prism-react-renderer";
import { useStore } from "@/store/useStore";

interface Props {
  code: string;
  /** Execution count (Colab In[n] / Out[n]). */
  count?: number;
  kind?: "in" | "out";
  /** Line numbers (0-based) to highlight as "currently executing". */
  activeLines?: number[];
  language?: "python";
  active?: boolean;
}

export function CodeCell({
  code,
  count = 1,
  kind = "in",
  activeLines,
  language = "python",
  active = false,
}: Props) {
  const theme = useStore((s) => s.theme);
  const prismTheme = theme === "dark" ? themes.nightOwl : themes.nightOwlLight;
  const live = new Set(activeLines ?? []);

  const promptText = kind === "in" ? `In [${count}]:` : `Out[${count}]:`;
  const promptClass = kind === "in" ? "nb-cell__prompt-in" : "nb-cell__prompt-out";

  return (
    <div className={`nb-cell ${active ? "nb-cell--active" : ""}`}>
      <div className={`nb-cell__gutter ${promptClass}`}>{promptText}</div>
      <div className="nb-cell__body">
        <Highlight theme={prismTheme} code={code.trimEnd()} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{
                ...style,
                background: "transparent",
                margin: 0,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.7,
              }}
            >
              {tokens.map((line, i) => {
                const isActive = live.has(i);
                const { key: _lineKey, ...lineProps } = getLineProps({ line });
                return (
                  <div
                    key={i}
                    {...lineProps}
                    className={`code-line ${isActive ? "code-line--on" : ""}`}
                  >
                    <span className="code-line__no">{i + 1}</span>
                    <span className="code-line__text">
                      {line.map((token, j) => {
                        const { key: _tokKey, ...tokProps } = getTokenProps({
                          token,
                        });
                        return <span key={j} {...tokProps} />;
                      })}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

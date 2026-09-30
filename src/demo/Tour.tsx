import { t } from "../i18n";

export type TourStop = { id: string; title: string; body: string; view: string };

// Guided tour bar (concept 10-demo). Stops come from the bundled tour.json; the
// bar renders controls and progress and never overlaps the working surface.
export function Tour({
  stops,
  index,
  onNext,
  onBack,
  onEnd,
  onJump,
}: {
  stops: TourStop[];
  index: number;
  onNext: () => void;
  onBack: () => void;
  onEnd: () => void;
  onJump: (index: number) => void;
}) {
  const stop = stops[index];
  if (!stop) return null;
  const last = index >= stops.length - 1;
  return (
    <aside className="demo-tour" role="dialog" aria-label={t("demo.tour")}>
      <div className="demo-tour-progress">
        {stops.map((row, i) => (
          <button
            key={row.id}
            type="button"
            className={i === index ? "on" : i < index ? "done" : ""}
            aria-label={row.title}
            aria-current={i === index}
            onClick={() => onJump(i)}
          />
        ))}
      </div>
      <div className="demo-tour-text">
        <span className="demo-tour-step">
          {index + 1} / {stops.length}
        </span>
        <strong>{stop.title}</strong>
        <p>{stop.body}</p>
      </div>
      <div className="demo-tour-actions">
        <button type="button" onClick={onBack} disabled={index === 0}>
          {t("demo.back")}
        </button>
        {last ? (
          <button type="button" className="primary" onClick={onEnd}>
            {t("demo.finish")}
          </button>
        ) : (
          <button type="button" className="primary" onClick={onNext}>
            {t("demo.next")}
          </button>
        )}
        <button type="button" onClick={onEnd}>
          {t("demo.stop")}
        </button>
      </div>
    </aside>
  );
}

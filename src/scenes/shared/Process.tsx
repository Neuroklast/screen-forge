import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SceneProps } from "../Scenes";
export type Job = {
  name: string;
  phases: string[];
  duration: number;
  startedAt: number;
  result: string;
};
export function processState(job: Job | null, time: number) {
  const progress = job
    ? Math.max(0, Math.min(1, (time - job.startedAt) / job.duration))
    : 0;
  const index = job
    ? Math.min(job.phases.length - 1, Math.floor(progress * job.phases.length))
    : 0;
  return {
    progress,
    index,
    done: progress === 1,
    phase: job?.phases[index] ?? "",
  };
}
export function useProcess({ time, onPlay, onTimelineExtend }: SceneProps) {
  const [job, setJob] = useState<Job | null>(null);
  const state = processState(job, time);
  return {
    ...state,
    job,
    clear: () => setJob(null),
    start: (
      name: string,
      phases: string[],
      duration: number,
      result: string,
    ) => {
      setJob({ name, phases, duration, startedAt: time, result });
      onTimelineExtend?.(time + duration);
      onPlay?.();
    },
  };
}
export function Changed({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <span className={`changed-value ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
export function ProcessReadout({
  process,
}: {
  process: ReturnType<typeof useProcess>;
}) {
  if (!process.job) return null;
  return (
    <section
      className="process-readout"
      aria-label="Process status"
      data-state={process.done ? "complete" : "running"}
    >
      <div className="between">
        <b>{process.job.name}</b>
        <Changed
          value={
            process.done ? "VERIFIED" : `${Math.floor(process.progress * 100)}%`
          }
        />
      </div>
      <div className="process-rail">
        <i style={{ width: `${process.progress * 100}%` }} />
      </div>
      <Changed value={process.done ? process.job.result : process.phase} />
      <div className="process-steps">
        {process.job.phases.map((phase, i) => (
          <span
            key={phase}
            className={
              process.done || i < process.index
                ? "done"
                : i === process.index
                  ? "current"
                  : ""
            }
          >
            {String(i + 1).padStart(2, "0")} {phase}
          </span>
        ))}
      </div>
      <button className="scene-button" onClick={process.clear}>
        {process.done ? "Dismiss result" : "Cancel operation"}
      </button>
    </section>
  );
}

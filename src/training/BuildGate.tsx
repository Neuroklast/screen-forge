import type { ReactNode } from "react";
import { useTraining } from "../core/useExercise";
import { buildInfo } from "../core/build";
import { t } from "../i18n";

// Blocks a control surface whose build no longer matches the server. The app
// shell may be a stale service-worker cache; reloading is the only safe action.
export function BuildGate({ children }: { children: ReactNode }) {
  const ex = useTraining();
  if (!ex.buildMismatch) return <>{children}</>;
  return (
    <main className="training-app">
      <section
        className="training-login"
        role="alertdialog"
        aria-modal="true"
        aria-label={t("build.updated")}
      >
        <span className="eyebrow">SCREENFORGE / EXERCISE CONTROL</span>
        <h1>{t("build.updated")}</h1>
        <p>{t("build.updatedHint")}</p>
        <p className="prepare-hint">
          {t("build.identity", { build: buildInfo.id.slice(0, 24) })}
        </p>
        <button className="primary" onClick={() => location.reload()}>
          {t("build.reload")}
        </button>
      </section>
    </main>
  );
}

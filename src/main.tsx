import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/inter/600.css";
import App from "./App";
import { sessionFromSearch } from "./core/session";
import { ExerciseProvider } from "./core/useExercise";
import { ConnectionGate } from "./training/ConnectionGate";
import { BuildGate } from "./training/BuildGate";
import "./training/training.css";
import { TrainerView } from "./views/TrainerView";
import { HqView } from "./views/HqView";
import { ElementView } from "./views/ElementView";
import { StartPage } from "./views/StartPage";
import { SafetyView } from "./views/SafetyView";
import { AssessorView } from "./views/AssessorView";
import { DemoHub } from "./demo/DemoHub";
import { TerminologyProvider } from "./ui/terminology/TerminologyProvider";
import "./tokens.css";
import "./layout.css";
import "./styles.css";
import "./scenes/corporate.css";
import "./scenes/os/os.css";
const session = sessionFromSearch(location.search);
// Field/output shells may run offline and keep a service worker. Control and
// editor surfaces never do: a stale cached app shell must be impossible there.
const fieldShell =
  session.demo || session.kiosk || session.role === "element" || session.role === "hq";
async function configureServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (fieldShell && import.meta.env.PROD) {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
    return;
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if (typeof caches !== "undefined")
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  } catch {
    /* service workers unsupported or blocked */
  }
}
void configureServiceWorker();
function Root() {
  if (session.demo) return <DemoHub kiosk={session.kiosk} />;
  if (!session.explicit) return <StartPage />;
  if (session.role === "film") return <App />;
  if (session.role === "safety" || session.role === "assessor")
    return (
      <ExerciseProvider role={session.role} room={session.room} station="">
        <BuildGate>
          <ConnectionGate>
            {session.role === "safety" ? (
              <SafetyView room={session.room} />
            ) : (
              <AssessorView room={session.room} />
            )}
          </ConnectionGate>
        </BuildGate>
      </ExerciseProvider>
    );
  return (
    <ExerciseProvider
      role={session.role}
      room={session.room}
      station={session.station}
    >
      <BuildGate>
        <ConnectionGate>
          {session.role === "trainer" ? (
            <TrainerView room={session.room} />
          ) : session.role === "hq" ? (
            <HqView room={session.room} />
          ) : (
            <ElementView station={session.station} />
          )}
        </ConnectionGate>
      </BuildGate>
    </ExerciseProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TerminologyProvider>
      <Root />
    </TerminologyProvider>
  </React.StrictMode>,
);

import "./scenes/shared/live.css";
import "./scenes/shared/warhead.css";
import "./scenes/blocks/blocks.css";
import "./director.css";
import "./fonts.css";

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
import "./training/training.css";
import { TrainerView } from "./views/TrainerView";
import { HqView } from "./views/HqView";
import { ElementView } from "./views/ElementView";
import "./tokens.css";
import "./styles.css";
import "./scenes/corporate.css";
import "./scenes/os/os.css";
const session = sessionFromSearch(location.search);
function Root() {
  if (session.role === "film") return <App />;
  return (
    <ExerciseProvider
      role={session.role}
      room={session.room}
      station={session.station}
    >
      <ConnectionGate>{session.role === "trainer" ? (
        <TrainerView room={session.room} />
      ) : session.role === "hq" ? (
        <HqView room={session.room} />
      ) : (
        <ElementView station={session.station} />
      )}
    </ConnectionGate></ExerciseProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

import "./scenes/shared/live.css";
import "./scenes/shared/warhead.css";
import "./scenes/blocks/blocks.css";
import './director.css';
import './fonts.css';

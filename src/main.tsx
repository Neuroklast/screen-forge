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
import "./styles.css";
import "./scenes/corporate.css";
import "./scenes/os/os.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import "./scenes/shared/live.css";

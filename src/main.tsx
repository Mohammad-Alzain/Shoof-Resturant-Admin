import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import "./index.css";
import App from "./App";

// Clickjacking fallback for hosts that cannot send `frame-ancestors`: never render inside another site.
if (window.top !== window.self) {
  try {
    window.top!.location.href = window.self.location.href;
  } catch {
    document.documentElement.innerHTML = "";
    throw new Error("Framing is not allowed");
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

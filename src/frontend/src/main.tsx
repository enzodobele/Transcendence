// frontend/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { StatusPage } from "./components/StatusPage";
import { SpectatorPage } from "./components/SpectatorPage";

const root = createRoot(document.getElementById("root")!);

if (window.location.pathname === "/status") {
  root.render(
    <StrictMode>
      <StatusPage />
    </StrictMode>,
  );
} else if (window.location.pathname === "/spectate") {
  root.render(
    <StrictMode>
      <SpectatorPage />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
}
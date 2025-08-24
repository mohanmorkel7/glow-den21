import { createRoot } from "react-dom/client";
import App from "./App";

// Ensure we only create one root
let root: ReturnType<typeof createRoot> | null = null;

function initializeApp() {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Root element not found");
  }

  // Only create root if it doesn't exist
  if (!root) {
    root = createRoot(container);
  }

  try {
    root.render(<App />);
  } catch (error) {
    console.error("Failed to render app:", error);
    // Show a fallback UI
    container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f8f9fa;
        font-family: system-ui, -apple-system, sans-serif;
        color: #dc2626;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <h1 style="margin-bottom: 1rem;">Application Failed to Load</h1>
          <p style="margin-bottom: 2rem; color: #6b7280;">
            There was an error starting the application. Please refresh the page.
          </p>
          <button
            onclick="window.location.reload()"
            style="
              background: #dc2626;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              cursor: pointer;
            "
          >
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}

// Initialize the app
initializeApp();

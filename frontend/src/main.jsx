import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.jsx"
import { ThemeProvider } from "@/components/theme-provider.jsx"
import { AuthProvider } from "./context/auth-provider.jsx"
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
import React from "react";
import { AppProvider } from "./context/AppContext";
import { AppRoutes } from "./routes/AppRoutes";
import "./index.css";

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;

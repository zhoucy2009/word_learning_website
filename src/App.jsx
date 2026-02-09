import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./AppContext.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import Reading from "./pages/Reading.jsx";
import Practice from "./pages/Practice.jsx";
import Notes from "./pages/Notes.jsx";
import Mistakes from "./pages/Mistakes.jsx";
import Settings from "./pages/Settings.jsx";
import Rankings from "./pages/Rankings.jsx";
import { getState, updateState } from "./data/logic.js";

export default function App() {
  const [state, setState] = React.useState(getState());

  const refresh = React.useCallback(() => {
    setState(getState());
  }, []);

  React.useEffect(() => {
    updateState((draft) => {
      draft.user.lastActiveDate = new Date().toISOString();
    });
  }, []);

  return (
    <AppProvider value={{ state, refresh }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/mistakes" element={<Mistakes />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

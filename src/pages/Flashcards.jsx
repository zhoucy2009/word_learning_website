import React from "react";
import { useApp } from "../AppContext.jsx";
import {
  selectFlashcardWords,
  getState,
  updateState,
  getWordState,
  updateWordState
} from "../data/logic.js";
import FlashcardDeck from "../components/FlashcardDeck.jsx";

export default function Flashcards() {
  const { state, refresh } = useApp();
  const courseId = state.user.courseId;
  const ability = state.user.abilityByCourse[courseId] || 0;
  const sessionSize = state.user.settings.sessionSize;
  const definitionLang = state.user.settings.definitionLang;
  const proMode = state.user.settings.proMode;

  const generateSession = () => {
    const freshState = getState();
    const words = selectFlashcardWords(courseId, ability, sessionSize, freshState, proMode);
    updateState((draft) => {
      words.forEach((word) => {
        const ws = getWordState(draft, courseId, word.id);
        if (ws.status === "unseen") {
          updateWordState(draft, courseId, word.id, { status: "interacted" });
        }
      });
    });
    return words;
  };

  const [sessionWords, setSessionWords] = React.useState(() => generateSession());

  React.useEffect(() => {
    setSessionWords(generateSession());
  }, [courseId, sessionSize, proMode]);

  const handleNewSession = () => {
    setSessionWords(generateSession());
    refresh();
  };

  return (
    <div className="stack">
      <h2>Flashcard Drill</h2>
      <FlashcardDeck
        words={sessionWords}
        courseId={courseId}
        onSessionChange={() => {}}
        onStateChange={refresh}
        state={state}
        definitionLang={definitionLang}
        proMode={proMode}
        onRestart={handleNewSession}
      />
      <div className="notice">
        <p>
          Rule: a word becomes learned when you select "I know this" or answer it
          correctly in practice. Flipping marks it as interacted.
        </p>
      </div>
    </div>
  );
}

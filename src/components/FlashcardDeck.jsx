import React from "react";
import { Link } from "react-router-dom";
import {
  getWordState,
  getWordDefinition,
  markInteracted,
  markLearned,
  updateState,
  updateWordState
} from "../data/logic.js";
import ProgressBar from "./ProgressBar.jsx";

export default function FlashcardDeck({
  words,
  courseId,
  onSessionChange,
  onStateChange,
  state,
  definitionLang,
  onRestart,
  proMode
}) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [history, setHistory] = React.useState([]);
  const [sessionWords, setSessionWords] = React.useState(words);
  const [learnedCount, setLearnedCount] = React.useState(0);
  const [flipCount, setFlipCount] = React.useState(0);
  const [initialCount, setInitialCount] = React.useState(words.length);

  React.useEffect(() => {
    setSessionWords(words);
    setIndex(0);
    setFlipped(false);
    setHistory([]);
    setLearnedCount(0);
    setFlipCount(0);
    setInitialCount(words.length);
  }, [words]);

  const current = sessionWords[index];
  const progressValue = current
    ? Math.min(initialCount, learnedCount + index)
    : initialCount;

  const handleFlip = () => {
    if (!current) return;
    setFlipped((prev) => !prev);
    setFlipCount((prev) => prev + 1);
    markInteracted(courseId, current.id);
    onStateChange();
  };

  const handleKnow = () => {
    if (!current) return;
    const prevState = { ...getWordState(state, courseId, current.id) };
    markLearned(courseId, current.id);
    const nextWords = sessionWords.filter((word) => word.id !== current.id);
    const nextIndex = Math.min(index, Math.max(nextWords.length - 1, 0));
    setHistory((prev) => [
      ...prev,
      {
        type: "know",
        wordId: current.id,
        prevState,
        prevIndex: index,
        prevWords: sessionWords
      }
    ]);
    setLearnedCount((prev) => prev + 1);
    setSessionWords(nextWords);
    setIndex(nextIndex);
    setFlipped(false);
    onSessionChange(nextWords.length);
    onStateChange();
  };

  const handleDontKnow = () => {
    if (!current) return;
    const nextWords = [...sessionWords];
    nextWords.splice(index, 1);
    nextWords.push(current);
    const nextIndex = Math.min(index, nextWords.length - 1);
    setHistory((prev) => [
      ...prev,
      {
        type: "dont-know",
        prevIndex: index,
        prevWords: sessionWords
      }
    ]);
    setSessionWords(nextWords);
    setIndex(nextIndex);
    setFlipped(false);
    onSessionChange(nextWords.length);
  };

  const handlePrevious = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    setSessionWords(last.prevWords);
    setIndex(last.prevIndex);
    setFlipped(false);
    if (last.type === "know") {
      updateState((draft) => {
        updateWordState(draft, courseId, last.wordId, last.prevState);
      });
      setLearnedCount((prev) => Math.max(prev - 1, 0));
      onStateChange();
    }
  };

  if (!current) {
    return (
      <div className="card stack">
        <h3>Session complete 🎉</h3>
        <p>
          Congratulations! You learned {learnedCount} word
          {learnedCount === 1 ? "" : "s"} in this session.
        </p>
        <div className="flex" style={{ flexWrap: "wrap" }}>
          <button onClick={onRestart}>Start new session</button>
          <button onClick={handlePrevious} className="secondary">
            Previous
          </button>
          <Link to="/">
            <button className="ghost">Exit to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card stack">
      <div className="flex" style={{ justifyContent: "space-between" }}>
        <span className="badge">
          Card {learnedCount + 1} / {initialCount}
        </span>
        <button className="ghost" onClick={handlePrevious}>
          Previous
        </button>
      </div>
      <ProgressBar label="Session progress" value={progressValue} total={initialCount} />

      <div className="flip-card" onClick={handleFlip}>
        <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
          <div className="flip-face">
            <h2 style={{ marginBottom: 8 }}>{current.lemma}</h2>
            <p>{current.phonetics}</p>
            {current.pos && <span className="badge">POS: {current.pos}</span>}
          </div>
          <div className="flip-face flip-back">
            {definitionLang !== "zh" && (
              <h3>EN: {getWordDefinition(current, proMode).en}</h3>
            )}
            {definitionLang !== "en" && (
              <h3>ZH: {getWordDefinition(current, proMode).zh}</h3>
            )}
            {current.pos && <p>POS: {current.pos}</p>}
            <p>{current.example}</p>
          </div>
        </div>
      </div>

      <div className="flex">
        <button onClick={handleKnow}>I know this</button>
        <button className="secondary" onClick={handleDontKnow}>
          I don't know this
        </button>
      </div>
    </div>
  );
}

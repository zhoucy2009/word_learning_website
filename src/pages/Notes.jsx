import React from "react";
import { useApp } from "../AppContext.jsx";
import {
  getDefinitionByToken,
  getWordById,
  getWordDefinition,
  removeFromNotes
} from "../data/logic.js";

export default function Notes() {
  const { state, refresh } = useApp();
  const proMode = state.user.settings.proMode;

  if (!proMode) {
    return (
      <div className="card stack">
        <h2>Notes (Pro only)</h2>
        <p>Enable Pro mode to access Notes.</p>
      </div>
    );
  }

  return (
    <div className="card stack">
      <h2>Notes</h2>
      {state.notes.length === 0 ? (
        <p>No saved words yet.</p>
      ) : (
        <div className="stack">
          {state.notes.map((item) => {
            const word = getWordById(item.wordId);
            const label = word
              ? word.lemma
              : item.wordId.startsWith("raw:")
                ? item.wordId.replace("raw:", "")
                : item.wordId;
            const fallback = item.wordId.startsWith("raw:")
              ? getDefinitionByToken(item.wordId.replace("raw:", ""), proMode)
              : null;
            const definition =
              item.definition || (word ? getWordDefinition(word, proMode) : fallback);
            return (
              <div key={item.id} className="card">
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{label}</h3>
                    {definition && (
                      <>
                        <div>EN: {definition.en}</div>
                        <div>ZH: {definition.zh}</div>
                      </>
                    )}
                    {word && (
                      <div className="footer" style={{ marginTop: 6 }}>
                        {word.pos && <span>{word.pos} · </span>}
                        {word.phonetics && <span>{word.phonetics}</span>}
                      </div>
                    )}
                    {word?.example && <p className="footer">{word.example}</p>}
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      removeFromNotes(item.id);
                      refresh();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

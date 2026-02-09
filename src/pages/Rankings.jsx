import React from "react";
import { useApp } from "../AppContext.jsx";
import { addFriend, getRankingList, getRankByVocab, removeFriend } from "../data/logic.js";

export default function Rankings() {
  const { state, refresh } = useApp();
  const courseId = state.user.courseId;
  const [name, setName] = React.useState("");
  const [vocab, setVocab] = React.useState("");
  const rankings = getRankingList(state, courseId);

  const handleAdd = () => {
    if (!name.trim()) return;
    const vocabValue = vocab ? Number(vocab) : 3000 + Math.round(Math.random() * 2000);
    addFriend(name.trim(), vocabValue);
    setName("");
    setVocab("");
    refresh();
  };

  return (
    <div className="card stack">
      <h2>Rankings</h2>
      <p>Ranking list among your connected friends (local mock).</p>
      <div className="stack" style={{ maxWidth: 420 }}>
        <label className="stack">
          Friend name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="stack">
          Estimated vocab (optional)
          <input
            type="number"
            placeholder="e.g. 4200"
            value={vocab}
            onChange={(event) => setVocab(event.target.value)}
          />
        </label>
        <button onClick={handleAdd}>Add friend</button>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Rank</th>
            <th>Vocab</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{getRankByVocab(item.vocabEstimate)}</td>
              <td>{item.vocabEstimate}</td>
              <td>
                {item.id !== "me" && (
                  <button
                    className="secondary"
                    onClick={() => {
                      removeFriend(item.id);
                      refresh();
                    }}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

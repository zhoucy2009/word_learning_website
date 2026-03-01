import React from "react";
import { useApp } from "../AppContext.jsx";
import { getCourses, setCourse, setSettings } from "../data/logic.js";
import { resetState } from "../data/storage.js";

export default function Settings() {
  const { state, refresh } = useApp();
  const [sessionSize, setSessionSize] = React.useState(
    state.user.settings.sessionSize
  );
  const [definitionLang, setDefinitionLang] = React.useState(
    state.user.settings.definitionLang
  );
  const [courseId, setCourseId] = React.useState(state.user.courseId);
  const [proMode, setProMode] = React.useState(state.user.settings.proMode);
  const courses = getCourses();

  const handleSave = () => {
    const normalizedSize = Math.min(20, Math.max(5, Number(sessionSize)));
    setSettings({ sessionSize: normalizedSize, definitionLang, proMode });
    if (courseId !== state.user.courseId) {
      setCourse(courseId);
    }
    refresh();
  };

  return (
    <div className="card stack" style={{ maxWidth: 520 }}>
      <h2>Settings</h2>
      <label className="stack">
        Current course
        <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>
      <label className="stack">
        Words per session (5-20)
        <input
          type="number"
          min="5"
          max="20"
          value={sessionSize}
          onChange={(event) => setSessionSize(event.target.value)}
        />
      </label>
      <label className="stack">
        Definition language
        <select
          value={definitionLang}
          onChange={(event) => setDefinitionLang(event.target.value)}
        >
          <option value="en">English</option>
          <option value="zh">Chinese</option>
          <option value="both">English + Chinese</option>
        </select>
      </label>
      <label className="stack">
        Pro mode
        <select value={proMode ? "on" : "off"} onChange={(event) => setProMode(event.target.value === "on")}>
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </label>
      <button onClick={handleSave}>Save settings</button>
      <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border, #ccc)" }} />
      <button
        className="ghost"
        style={{ color: "crimson" }}
        onClick={() => {
          if (window.confirm("Reset all progress? This will clear all learned words, notes, mistakes, and practice history.")) {
            resetState();
            window.location.reload();
          }
        }}
      >
        Reset All Progress
      </button>
    </div>
  );
}

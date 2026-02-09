import React from "react";
import { Link, NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import {
  getCourseById,
  getCourses,
  getDailyProgress,
  getRankByVocab,
  getVocabEstimate,
  setCourse
} from "../data/logic.js";
import { setSettings } from "../data/logic.js";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/flashcards", label: "Flashcards" },
  { to: "/reading", label: "Guided Reading" },
  { to: "/practice", label: "Practice" },
  { to: "/rankings", label: "Rankings" },
  { to: "/notes", label: "Notes" },
  { to: "/mistakes", label: "Mistakes" },
  { to: "/settings", label: "Settings" }
];

export default function Layout() {
  const { state, refresh } = useApp();
  const location = useLocation();
  if (!state.user.hasPlacement && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  const course = getCourseById(state.user.courseId);
  const courses = getCourses();
  const proMode = state.user.settings.proMode;
  const vocabEstimate = getVocabEstimate(state, state.user.courseId);
  const progress = getDailyProgress(state, state.user.courseId);
  const rank = getRankByVocab(vocabEstimate);

  return (
    <div className={`app-shell ${proMode ? "pro" : ""}`}>
      <header>
        <Link to="/" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Word Learning
        </Link>
        <nav>
          {navItems.map((item) => {
            if (!proMode && (item.to === "/notes" || item.to === "/mistakes")) {
              return (
                <span key={item.to} className="nav-locked">
                  {item.label} 🔒
                </span>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  opacity: isActive ? 1 : 0.7,
                  textDecoration: isActive ? "underline" : "none"
                })}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <select
          value={state.user.courseId}
          onChange={(event) => {
            setCourse(event.target.value);
            refresh();
          }}
          style={{ maxWidth: 140 }}
        >
          {courses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className={`pro-toggle ${proMode ? "secondary" : "ghost"}`}
          onClick={() => {
            setSettings({ proMode: !proMode });
            refresh();
          }}
        >
          {proMode ? "Pro mode: ON" : "Pro mode: OFF"}
        </button>
      </header>
      <main>
        <div className="flex" style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <span className="badge">Course: {course.name}</span>
          <span className="badge">Rank: {rank}</span>
          <span className="badge">Today learned: {progress.learnedToday}</span>
          <span className="badge">
            Estimated vocab: {vocabEstimate}
          </span>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

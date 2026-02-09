import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../AppContext.jsx";
import {
  getCourses,
  getWordsForCourse,
  buildMcqItem,
  markPlacementComplete
} from "../data/logic.js";

const DEFAULT_VOCAB = 2000;

function buildPlacementQuestions(courseId, size) {
  const pool = getWordsForCourse(courseId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, size);
  return shuffled.map((word) => ({
    ...buildMcqItem(word, pool, false),
    difficulty: word.difficulty
  }));
}

function estimateVocabFromResults(results) {
  if (!results.length) return DEFAULT_VOCAB;
  const correct = results.filter((item) => item.isCorrect);
  const avgDifficulty = correct.length
    ? Math.round(
        correct.reduce((sum, item) => sum + item.difficulty, 0) / correct.length
      )
    : 0;
  const accuracyBonus = Math.round((correct.length / results.length) * 1000);
  const vocab = Math.min(14000, Math.max(2000, 2000 + avgDifficulty * 12 + accuracyBonus));
  return vocab;
}

export default function Onboarding() {
  const { state, refresh } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const courses = getCourses();
  const isMiniTest = location.state?.mode === "mini";
  const questionCount = isMiniTest ? 3 : 5;
  const [courseId, setCourseId] = React.useState(state.user.courseId);
  const [questions, setQuestions] = React.useState(() =>
    buildPlacementQuestions(courseId, questionCount)
  );
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState({});

  React.useEffect(() => {
    setQuestions(buildPlacementQuestions(courseId, questionCount));
    setCurrentIndex(0);
    setAnswers({});
  }, [courseId, questionCount]);

  const current = questions[currentIndex];

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleFinish = () => {
    const results = questions.map((question, index) => ({
      difficulty: question.difficulty,
      isCorrect: answers[index] === question.answer
    }));
    const vocab = estimateVocabFromResults(results);
    markPlacementComplete({ courseId, vocab, isMiniTest });
    refresh();
    navigate("/");
  };

  const handleSkip = () => {
    markPlacementComplete({ courseId, vocab: DEFAULT_VOCAB, isMiniTest: false });
    refresh();
    navigate("/");
  };

  return (
    <div className="card stack" style={{ maxWidth: 640 }}>
      <h2>{isMiniTest ? "Mini Test" : "Placement Test"}</h2>
      <p>
        Choose a course first. You can skip the test; default vocabulary estimate is{" "}
        {DEFAULT_VOCAB}.
      </p>
      <label className="stack">
        Course
        <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>

      {current ? (
        <div className="stack">
          <div className="badge">
            Question {currentIndex + 1} / {questions.length}
          </div>
          <h3>{current.prompt}</h3>
          <div className="stack">
            {current.options.map((option) => (
              <button
                key={option}
                className={answers[currentIndex] === option ? "secondary" : "ghost"}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            {!isMiniTest && (
              <button className="secondary" onClick={handleSkip}>
                Skip test
              </button>
            )}
            <button
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  handleFinish();
                }
              }}
            >
              {currentIndex < questions.length - 1 ? "Next" : "Finish"}
            </button>
          </div>
        </div>
      ) : (
        <p>No questions available yet.</p>
      )}
    </div>
  );
}

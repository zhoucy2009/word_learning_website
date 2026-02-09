const STORAGE_KEY = "word_learning_v1";

const defaultState = {
  user: {
    id: "guest",
    courseId: "igcse",
    abilityByCourse: {
      igcse: 320,
      ib: 420,
      ielts: 460,
      toefl: 440,
      gre: 600
    },
    vocabEstimateByCourse: {},
    settings: {
      sessionSize: 5,
      definitionLang: "en",
      proMode: false
    },
    hasPlacement: false,
    lastPlacementDate: null,
    lastMiniTestDate: null,
    lastActiveDate: null
  },
  wordStates: {},
  notes: [],
  mistakes: [],
  basket: [],
  practiceHistory: [],
  friends: [
    { id: "f1", name: "Ava", vocabEstimate: 3200 },
    { id: "f2", name: "Leo", vocabEstimate: 4100 },
    { id: "f3", name: "Mina", vocabEstimate: 5200 }
  ]
};

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    const normalizeList = (items, prefix) =>
      (items || []).map((item, index) =>
        typeof item === "string"
          ? {
              id: `${prefix}_${index}_${item}`,
              wordId: item,
              definition: null,
              createdAt: null
            }
          : item
      );
    return {
      ...structuredClone(defaultState),
      ...parsed,
      user: { ...structuredClone(defaultState.user), ...parsed.user },
      wordStates: parsed.wordStates || {},
      notes: normalizeList(parsed.notes, "note"),
      mistakes: normalizeList(parsed.mistakes, "mistake"),
      basket: parsed.basket || [],
      practiceHistory: parsed.practiceHistory || [],
      friends: parsed.friends || structuredClone(defaultState.friends)
    };
  } catch (err) {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

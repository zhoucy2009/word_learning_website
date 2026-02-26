import {
  courses,
  words,
  passages,
  courseWordMap,
  proCourseWordMap,
  extraDefinitions
} from "./seed.js";
import { loadState, saveState } from "./storage.js";

export function getCourses() {
  return courses;
}

export function getCourseById(courseId) {
  return courses.find((course) => course.id === courseId) || courses[0];
}

export function abilityToVocab(ability) {
  return Math.max(2000, Math.round(2000 + ability * 12));
}

export function vocabToAbility(vocab) {
  return Math.max(0, Math.round((vocab - 2000) / 12));
}

export function getVocabEstimate(state, courseId) {
  return (
    state.user.vocabEstimateByCourse?.[courseId] ||
    abilityToVocab(state.user.abilityByCourse?.[courseId] || 0)
  );
}

export function getRankByVocab(vocab) {
  const tiers = [
    { name: "Rookie", min: 0, max: 200 },
    { name: "Bronze I", min: 200, max: 400 },
    { name: "Bronze II", min: 400, max: 650 },
    { name: "Silver I", min: 650, max: 900 },
    { name: "Silver II", min: 900, max: 1200 },
    { name: "Gold I", min: 1200, max: 1600 },
    { name: "Gold II", min: 1600, max: 2100 },
    { name: "Platinum I", min: 2100, max: 2800 },
    { name: "Platinum II", min: 2800, max: 3600 },
    { name: "Diamond I", min: 3600, max: 4800 },
    { name: "Diamond II", min: 4800, max: 6200 },
    { name: "Master", min: 6200, max: 8000 },
    { name: "Grandmaster", min: 8000, max: 10500 },
    { name: "Legend", min: 10500, max: Infinity }
  ];
  const match = tiers.find((tier) => vocab >= tier.min && vocab < tier.max);
  return match ? match.name : "Rookie";
}

export function getWordsForCourse(courseId, options = {}) {
  const { proMode = false } = options;
  const baseIds = courseWordMap[courseId] || [];
  const proIds = proCourseWordMap?.[courseId] || [];
  const ids = proMode ? [...new Set([...baseIds, ...proIds])] : baseIds;
  return words.filter((word) => ids.includes(word.id));
}

export function getWordById(wordId) {
  return words.find((word) => word.id === wordId);
}

export function getPassagesForCourse(courseId) {
  return passages.filter((passage) => passage.courseId === courseId);
}

export function getState() {
  return loadState();
}

export function updateState(mutator) {
  const state = loadState();
  mutator(state);
  saveState(state);
  return state;
}

export function getWordState(state, courseId, wordId) {
  if (!state.wordStates[courseId]) state.wordStates[courseId] = {};
  if (!state.wordStates[courseId][wordId]) {
    state.wordStates[courseId][wordId] = {
      status: "unseen",
      mastery: 0,
      lastSeenAt: null
    };
  }
  return state.wordStates[courseId][wordId];
}

export function updateWordState(state, courseId, wordId, updates) {
  const existing = getWordState(state, courseId, wordId);
  state.wordStates[courseId][wordId] = {
    ...existing,
    ...updates
  };
}

export function setCourse(courseId) {
  return updateState((state) => {
    state.user.courseId = courseId;
  });
}

export function setSettings(updates) {
  return updateState((state) => {
    state.user.settings = { ...state.user.settings, ...updates };
  });
}

export function setAbility(courseId, ability) {
  return updateState((state) => {
    state.user.abilityByCourse[courseId] = ability;
    state.user.vocabEstimateByCourse[courseId] = abilityToVocab(ability);
  });
}

export function setVocabEstimate(courseId, vocab) {
  return updateState((state) => {
    state.user.vocabEstimateByCourse[courseId] = vocab;
    state.user.abilityByCourse[courseId] = vocabToAbility(vocab);
  });
}

export function markPlacementComplete({ courseId, vocab, isMiniTest }) {
  return updateState((state) => {
    state.user.hasPlacement = true;
    state.user.vocabEstimateByCourse[courseId] = vocab;
    state.user.abilityByCourse[courseId] = vocabToAbility(vocab);
    const now = new Date().toISOString();
    if (isMiniTest) {
      state.user.lastMiniTestDate = now;
    } else {
      state.user.lastPlacementDate = now;
    }
  });
}

export function shouldPromptMiniTest(state) {
  const lastTest = state.user.lastMiniTestDate || state.user.lastPlacementDate;
  if (!lastTest) return false;
  const diff = Date.now() - new Date(lastTest).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 10;
}

export function addFriend(name, vocabEstimate) {
  return updateState((state) => {
    const id = `friend_${Date.now()}`;
    state.friends.push({ id, name, vocabEstimate });
  });
}

export function removeFriend(friendId) {
  return updateState((state) => {
    state.friends = state.friends.filter((friend) => friend.id !== friendId);
  });
}

export function getRankingList(state, courseId) {
  const myVocab = getVocabEstimate(state, courseId);
  const items = [
    { id: "me", name: "You", vocabEstimate: myVocab },
    ...state.friends
  ];
  return items
    .map((item) => ({ ...item, rank: getRankByVocab(item.vocabEstimate) }))
    .sort((a, b) => b.vocabEstimate - a.vocabEstimate);
}

export function addToBasket(wordId) {
  return updateState((state) => {
    if (!state.basket.includes(wordId)) state.basket.push(wordId);
  });
}

export function removeFromBasket(wordId) {
  return updateState((state) => {
    state.basket = state.basket.filter((id) => id !== wordId);
  });
}

export function clearBasket() {
  return updateState((state) => {
    state.basket = [];
  });
}

export function addToNotes(wordId) {
  return updateState((state) => {
    addToCollection(state, "notes", wordId);
  });
}

export function addToMistakes(wordId) {
  return updateState((state) => {
    addToCollection(state, "mistakes", wordId);
  });
}

export function removeFromNotes(itemId) {
  return updateState((state) => {
    state.notes = state.notes.filter((item) => item.id !== itemId);
  });
}

export function removeFromMistakes(itemId) {
  return updateState((state) => {
    state.mistakes = state.mistakes.filter((item) => item.id !== itemId);
  });
}

export function markInteracted(courseId, wordId) {
  return updateState((state) => {
    const current = getWordState(state, courseId, wordId);
    if (current.status === "learned") return;
    updateWordState(state, courseId, wordId, {
      status: "interacted",
      lastSeenAt: new Date().toISOString()
    });
  });
}

export function markLearned(courseId, wordId) {
  return updateState((state) => {
    updateWordState(state, courseId, wordId, {
      status: "learned",
      mastery: 100,
      lastSeenAt: new Date().toISOString()
    });
  });
}

export function recordPractice(courseId, items, results) {
  return updateState((state) => {
    const now = new Date().toISOString();
    state.practiceHistory.push({ courseId, items, results, createdAt: now });
    results.forEach((result) => {
      if (result.isCorrect) {
        updateWordState(state, courseId, result.wordId, {
          status: "learned",
          mastery: 100,
          lastSeenAt: now
        });
      } else {
        addToCollection(state, "mistakes", result.wordId);
        updateWordState(state, courseId, result.wordId, {
          status: "interacted",
          lastSeenAt: now
        });
      }
    });
  });
}

export function getDailyProgress(state, courseId) {
  const today = new Date().toISOString().slice(0, 10);
  const wordStates = state.wordStates[courseId] || {};
  let interactedToday = 0;
  let learnedToday = 0;
  Object.values(wordStates).forEach((entry) => {
    if (!entry.lastSeenAt) return;
    if (!entry.lastSeenAt.startsWith(today)) return;
    if (entry.status === "learned") learnedToday += 1;
    if (entry.status === "interacted") interactedToday += 1;
  });
  return { interactedToday, learnedToday };
}

export function estimateVocabSize(abilityRank) {
  return abilityToVocab(abilityRank);
}

export function selectFlashcardWords(courseId, abilityRank, size, state, proMode = false) {
  const all = getWordsForCourse(courseId, { proMode }).map((word) => ({
    word,
    state: getWordState(state, courseId, word.id)
  }));
  // Prefer words the learner has never seen ("unseen") for new sessions.
  // Fall back to non-learned words when we run out of unseen items.
  const nonLearned = all.filter((entry) => entry.state.status !== "learned");
  const unseen = nonLearned.filter((entry) => entry.state.status === "unseen");
  const basePool =
    unseen.length >= size
      ? unseen
      : unseen.length > 0
      ? [...unseen, ...nonLearned.filter((entry) => entry.state.status !== "unseen")]
      : nonLearned;
  const learned = all.filter((entry) => entry.state.status === "learned");
  const targetWindow = proMode ? 120 : 80;
  const filtered = basePool.filter(
    (entry) => Math.abs(entry.word.difficulty - abilityRank) <= targetWindow
  );
  const pool = filtered.length ? filtered : basePool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, size).map((entry) => entry.word);

  if (selected.length < size && learned.length) {
    const review = [...learned]
      .sort(() => Math.random() - 0.5)
      .slice(0, size - selected.length)
      .map((entry) => entry.word);
    selected.push(...review);
  }

  if (proMode) {
    return selected.sort((a, b) => b.difficulty - a.difficulty);
  }
  return selected;
}

export function selectReadingPassage(courseId, abilityRank) {
  const pool = getPassagesForCourse(courseId);
  if (!pool.length) return null;
  const sorted = [...pool].sort(
    (a, b) => Math.abs(a.difficulty - abilityRank) - Math.abs(b.difficulty - abilityRank)
  );
  return sorted[0];
}

export function selectPracticeItems(courseId, abilityRank, size, state, proMode = false) {
  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const allWords = getWordsForCourse(courseId, { proMode });
  const candidates = allWords.filter((word) => {
    const entry = getWordState(state, courseId, word.id);
    return entry.status === "interacted" || entry.status === "learned";
  });
  const recent = candidates.filter((word) => {
    const entry = getWordState(state, courseId, word.id);
    if (!entry.lastSeenAt) return false;
    return new Date(entry.lastSeenAt) >= recentThreshold;
  });
  const older = candidates.filter((word) => !recent.includes(word));
  const targetRecent = Math.round(size * 0.7);
  const targetOlder = size - targetRecent;

  const pick = (list, count) =>
    [...list].sort(() => Math.random() - 0.5).slice(0, count);

  const selected = [...pick(recent, targetRecent), ...pick(older, targetOlder)];
  if (selected.length < size) {
    const remaining = candidates.filter((word) => !selected.includes(word));
    selected.push(...pick(remaining, size - selected.length));
  }
  if (!selected.length) {
    const fallback = getWordsForCourse(courseId, { proMode })
      .filter((word) => Math.abs(word.difficulty - abilityRank) <= (proMode ? 160 : 120))
      .slice(0, size);
    selected.push(...fallback);
  }
  return selected;
}

export function getWordDefinition(word, proMode = false) {
  if (proMode && word.pro) return word.pro;
  return word.senses;
}

export function getDefinitionByToken(token, proMode = false) {
  const normalized = token.toLowerCase();
  const match = words.find((word) => word.lemma.toLowerCase() === normalized);
  if (match) return getWordDefinition(match, proMode);
  return extraDefinitions[normalized] || null;
}

function buildDefinitionSnapshot(wordId, proMode) {
  if (wordId.startsWith("raw:")) {
    const token = wordId.replace("raw:", "");
    const fallback = getDefinitionByToken(token, proMode);
    return {
      en: fallback?.en || "Definition not available.",
      zh: fallback?.zh || "暂无释义",
      pos: null,
      phonetics: null,
      example: null
    };
  }
  const word = getWordById(wordId);
  if (!word) {
    return {
      en: "Definition not available.",
      zh: "暂无释义",
      pos: null,
      phonetics: null,
      example: null
    };
  }
  const definition = getWordDefinition(word, proMode);
  return {
    en: definition.en,
    zh: definition.zh,
    pos: word.pos || null,
    phonetics: word.phonetics || null,
    example: word.example || null
  };
}

function addToCollection(state, collection, wordId) {
  const exists = state[collection].some((item) => item.wordId === wordId);
  if (exists) return;
  const now = new Date().toISOString();
  state[collection].push({
    id: `${collection}_${Date.now()}_${wordId}`,
    wordId,
    definition: buildDefinitionSnapshot(wordId, state.user.settings.proMode),
    createdAt: now
  });
}

export function buildMcqItem(word, allWords, proMode = false) {
  const definition = getWordDefinition(word, proMode);
  const options = [word];
  const pool = allWords.filter((candidate) => candidate.id !== word.id);
  while (options.length < 4 && pool.length) {
    const choice = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    options.push(choice);
  }
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return {
    type: "mcq",
    wordId: word.id,
    prompt: `Choose the best definition for "${word.lemma}"`,
    options: shuffled.map((item) => getWordDefinition(item, proMode).en),
    answer: definition.en
  };
}

export function buildSpellingItem(word, proMode = false) {
  const definition = getWordDefinition(word, proMode);
  return {
    type: "spelling",
    wordId: word.id,
    prompt: `Type the word that matches: ${definition.en}`,
    answer: word.lemma
  };
}

export function calculateAbilityUpdate(currentAbility, results, proMode = false) {
  if (!results.length) return currentAbility;
  const correct = results.filter((result) => result.isCorrect);
  const avgDifficulty = correct.length
    ? Math.round(
        correct
          .map((result) => getWordById(result.wordId)?.difficulty || 0)
          .reduce((sum, value) => sum + value, 0) / correct.length
      )
    : currentAbility;
  if (!proMode) {
    return Math.round(currentAbility * 0.8 + avgDifficulty * 0.2);
  }
  const accuracy = correct.length / results.length;
  const avgTime = results.reduce((sum, result) => sum + result.timeSpent, 0) / results.length;
  const speedBonus = avgTime < 6000 ? 30 : avgTime < 10000 ? 15 : 0;
  const accuracyBonus = accuracy >= 0.8 ? 40 : accuracy >= 0.6 ? 20 : 0;
  return Math.round(currentAbility * 0.7 + (avgDifficulty + speedBonus + accuracyBonus) * 0.3);
}

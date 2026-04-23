export function scoreSeason(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scorePlacement(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scoreAge(guess, answer) {
  const diff = Math.abs(guess - answer);
  if (diff <= 3)  return 12;
  if (diff <= 5)  return 8;
  if (diff <= 10) return 4;
  return 0;
}

export function scoreTribeColor(guess, answer) {
  return guess === answer ? 8 : 0;
}

export function scoreAll(guesses, answer) {
  const season     = scoreSeason(guesses.season,     answer.season);
  const placement  = scorePlacement(guesses.placement, answer.placement);
  const age        = scoreAge(guesses.age,            answer.age);
  const tribeColor = scoreTribeColor(guesses.tribeColor, answer.tribe_color);
  const total = season + placement + age + tribeColor;
  return { season, placement, age, tribeColor, total };
}

export function getGrade(score) {
  if (score === 100) return "A+";
  if (score >= 93)   return "A";
  if (score >= 90)   return "A-";
  if (score >= 87)   return "B+";
  if (score >= 83)   return "B";
  if (score >= 80)   return "B-";
  if (score >= 77)   return "C+";
  if (score >= 73)   return "C";
  if (score >= 70)   return "C-";
  if (score >= 67)   return "D+";
  if (score >= 63)   return "D";
  if (score >= 60)   return "D-";
  return "F";
}

export function buildStintMap(contestants) {
  const grouped = {};
  for (const c of contestants) {
    if (!grouped[c.castaway_id]) grouped[c.castaway_id] = [];
    grouped[c.castaway_id].push(c);
  }
  for (const id in grouped) {
    grouped[id].sort((a, b) => a.season - b.season);
  }
  const stintMap = {};
  for (const id in grouped) {
    grouped[id].forEach((c, idx) => {
      const labels = ["First Appearance", "Second Appearance", "Third Appearance", "Fourth Appearance"];
      stintMap[c.id] = c.returnee ? (labels[idx] || `Appearance ${idx + 1}`) : null;
    });
  }
  return stintMap;
}

export function getEligibleContestants(contestants) {
  const maxSeason = Math.max(...contestants.map(c => c.season));
  return contestants.filter(c => c.season !== maxSeason);
}

export function pickRandom(pool, seenIds) {
  const available = pool.filter(c => !seenIds.has(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
export function normalizeNickname(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 12);
  return cleaned.length > 0 ? cleaned : 'Guest';
}

export function isNewBest(existingScore, candidateScore) {
  return existingScore == null || candidateScore > existingScore;
}

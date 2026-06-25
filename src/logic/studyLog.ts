export function uniqueTagIds(tagIds: number[]): number[] {
  return [...new Set(tagIds)];
}

export function isHistoricalReview(reviewedAt: string, lastReviewedAt?: string): boolean {
  return Boolean(lastReviewedAt && reviewedAt < lastReviewedAt);
}

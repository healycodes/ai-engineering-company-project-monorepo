import type { Candidate } from "../types/models.js";
export function linearSearchById(candidates: Candidate[], id: string): Candidate | null { for (const c of candidates) { if (c.id === id) return c; } return null; }
export function binarySearchById(candidates: Candidate[], id: string): number { let left = 0; let right = candidates.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); const candidate = candidates[mid]; if (!candidate) break; if (candidate.id === id) return mid; if (candidate.id < id) { left = mid + 1; } else { right = mid - 1; } } return -1; }

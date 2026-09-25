import type { Candidate } from "../types/models.js";

export function findCandidateById(candidates: Candidate[], id: string): Candidate | null {
  for (const candidate of candidates) {
    if (candidate.id === id) {
      return candidate;
    }
  }

  return null;
}

export function findCandidateByEmail(candidates: Candidate[], email: string): Candidate | null {
  for (const candidate of candidates) {
    if (candidate.email.toLowerCase() === email.toLowerCase()) {
      return candidate;
    }
  }

  return null;
}

export function binarySearchCandidateBySalary(candidates: Candidate[], targetSalary: number): number {
  let left = 0;
  let right = candidates.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const candidate = candidates[middle];

    if (!candidate) {
      return -1;
    }

    if (candidate.expectedSalary === targetSalary) {
      return middle;
    }

    if (candidate.expectedSalary < targetSalary) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return -1;
}

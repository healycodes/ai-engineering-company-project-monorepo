import type { AvailabilityStatus, Candidate, SeniorityLevel } from "../types/models.js";

export interface SortCriterion<T> {
  field: keyof T;
  ascending: boolean;
}

export function filterByCriteria<T>(items: T[], criteria: Partial<T>): T[] {
  const fields = Object.keys(criteria) as Array<keyof T>;
  return items.filter((item) => fields.every((field) => item[field] === criteria[field]));
}

export function filterCandidatesBySkills(candidates: Candidate[], requiredSkills: string[]): Candidate[] {
  const skills = requiredSkills.map((skill) => skill.toLowerCase());
  return candidates.filter((candidate) => {
    const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
    return skills.every((skill) => candidateSkills.has(skill));
  });
}

export function filterCandidatesByStatus(candidates: Candidate[], status: Candidate["status"]): Candidate[] {
  return candidates.filter((candidate) => candidate.status === status);
}

export function filterCandidatesBySeniority(candidates: Candidate[], seniority: SeniorityLevel): Candidate[] {
  return candidates.filter((candidate) => candidate.seniority === seniority);
}

export function filterCandidatesByAvailability(candidates: Candidate[], availability: AvailabilityStatus[]): Candidate[] {
  return candidates.filter((candidate) => availability.includes(candidate.availability));
}

export function sortByField<T>(items: T[], field: keyof T, ascending: boolean = true): T[] {
  return [...items].sort((left, right) => {
    const leftValue = left[field] as number | string;
    const rightValue = right[field] as number | string;

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return ascending ? leftValue - rightValue : rightValue - leftValue;
    }

    const comparison = String(leftValue).localeCompare(String(rightValue));
    return ascending ? comparison : comparison * -1;
  });
}

export function sortCandidatesByExperience(candidates: Candidate[], order: "asc" | "desc" = "asc"): Candidate[] {
  return sortByField(candidates, "yearsOfExperience", order === "asc");
}

export function sortCandidatesBySalary(candidates: Candidate[], order: "asc" | "desc" = "asc"): Candidate[] {
  return sortByField(candidates, "expectedSalary", order === "asc");
}

export function sortByMultipleFields<T>(items: T[], criteria: Array<SortCriterion<T>>): T[] {
  return [...items].sort((left, right) => {
    for (const criterion of criteria) {
      const leftValue = left[criterion.field];
      const rightValue = right[criterion.field];
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

      if (comparison !== 0) {
        return criterion.ascending ? comparison : comparison * -1;
      }
    }

    return 0;
  });
}

export function groupBy<T, K extends string>(items: T[], getKey: (item: T) => K): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] ?? [];
    groups[key].push(item);
    return groups;
  }, {});
}


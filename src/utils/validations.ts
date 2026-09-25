import type { Candidate, Vacancy } from "../types/models.js";

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateCandidate(candidate: Candidate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!candidate.fullName?.trim()) {
    errors.push("Candidate full name is required.");
  }

  if (!isValidEmail(candidate.email)) {
    errors.push("A valid email address is required.");
  }

  if (!Number.isFinite(candidate.yearsOfExperience) || candidate.yearsOfExperience < 0 || candidate.yearsOfExperience > 50) {
    errors.push("Experience years must be between 0 and 50.");
  }

  if (!Number.isFinite(candidate.currentSalary) || candidate.currentSalary <= 0) {
    errors.push("Current salary must be greater than zero.");
  }

  if (!Number.isFinite(candidate.expectedSalary) || candidate.expectedSalary <= 0) {
    errors.push("Expected salary must be greater than zero.");
  }

  if (!Array.isArray(candidate.skills) || candidate.skills.length === 0 || candidate.skills.some((skill) => !skill?.trim())) {
    errors.push("At least one non-empty skill is required.");
  }

  if (!candidate.phone?.trim()) {
    errors.push("Candidate phone is required.");
  }

  return { valid: errors.length === 0, errors };
}

export function validateVacancy(vacancy: Vacancy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(vacancy.requiredSkills) || vacancy.requiredSkills.length === 0 || vacancy.requiredSkills.some((skill) => !skill?.trim())) {
    errors.push("At least one required skill is needed.");
  }

  if (!Number.isFinite(vacancy.minYearsExperience) || vacancy.minYearsExperience < 0) {
    errors.push("Minimum experience must be at least zero.");
  }

  if (!Number.isFinite(vacancy.maxYearsExperience) || vacancy.maxYearsExperience < vacancy.minYearsExperience) {
    errors.push("Maximum experience must be at least minimum experience.");
  }

  if (!Number.isFinite(vacancy.salaryRangeMin) || vacancy.salaryRangeMin <= 0) {
    errors.push("Minimum salary must be greater than zero.");
  }

  if (!Number.isFinite(vacancy.salaryRangeMax) || vacancy.salaryRangeMax <= 0 || vacancy.salaryRangeMax < vacancy.salaryRangeMin) {
    errors.push("Maximum salary must be positive and at least minimum salary.");
  }

  return { valid: errors.length === 0, errors };
}

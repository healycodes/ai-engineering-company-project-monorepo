import { expect, test } from "@playwright/test";
import { sampleCandidates, sampleVacancy, type Candidate, type SelectionProcess } from "../src/types/models.js";
import {
  filterCandidatesByAvailability,
  filterCandidatesBySeniority,
  filterCandidatesBySkills,
  sortCandidatesByExperience,
  sortCandidatesBySalary,
} from "../src/utils/collections.js";
import { binarySearchCandidateBySalary, findCandidateByEmail, findCandidateById } from "../src/utils/search.js";
import {
  calculateAverageSalary, calculateCandidateScore, calculateVacancyFillRate,
  countCandidatesByStatus, findTopSkills, groupCandidatesBySeniority, rankCandidatesForVacancy,
} from "../src/utils/transformations.js";
import { isValidEmail, validateCandidate, validateVacancy } from "../src/utils/validations.js";

const [maria, juan, carolina] = sampleCandidates as [Candidate, Candidate, Candidate];

test("filters and sorts by Nexova fields without mutation", () => {
  expect(filterCandidatesBySkills(sampleCandidates, ["typescript", "NODE.JS"])).toEqual([maria, carolina]);
  expect(filterCandidatesBySkills(sampleCandidates, [])).toHaveLength(3);
  expect(filterCandidatesBySeniority(sampleCandidates, "Senior")).toEqual([carolina]);
  expect(filterCandidatesByAvailability(sampleCandidates, ["Immediate", "2 weeks"])).toEqual([juan, carolina]);
  expect(sortCandidatesBySalary(sampleCandidates, "desc")).toEqual([carolina, maria, juan]);
  expect(sortCandidatesByExperience(sampleCandidates, "asc")).toEqual([juan, maria, carolina]);
  expect(sampleCandidates).toEqual([maria, juan, carolina]);
});

test("linear identity and email lookups and binary salary search", () => {
  expect(findCandidateById(sampleCandidates, maria.id)).toBe(maria);
  expect(findCandidateById(sampleCandidates, "missing")).toBeNull();
  expect(findCandidateByEmail(sampleCandidates, "JUAN.PEREZ@EMAIL.COM")).toBe(juan);
  expect(findCandidateByEmail([], "missing")).toBeNull();
  const sorted = sortCandidatesBySalary(sampleCandidates, "asc");
  expect(binarySearchCandidateBySalary(sorted, 4200)).toBe(1);
  expect(binarySearchCandidateBySalary(sorted, 9999)).toBe(-1);
  expect(binarySearchCandidateBySalary([], 4200)).toBe(-1);
});

test("candidate scoring respects all point ceilings and boundaries", () => {
  expect(calculateCandidateScore(maria, sampleVacancy)).toBe(82);
  expect(calculateCandidateScore(juan, sampleVacancy)).toBe(10);
  expect(calculateCandidateScore(carolina, sampleVacancy)).toBe(100);
  expect(calculateCandidateScore({ ...carolina, skills: [...carolina.skills, "React"] }, sampleVacancy)).toBe(100);
  expect(calculateCandidateScore({ ...carolina, expectedSalary: 8400 }, sampleVacancy)).toBe(95);
  expect(calculateCandidateScore({ ...carolina, expectedSalary: 8401 }, sampleVacancy)).toBe(90);
  expect(rankCandidatesForVacancy(sampleCandidates, sampleVacancy).map(({ candidate }) => candidate)).toEqual([carolina, maria, juan]);
});

test("aggregations handle empty inputs, counts, skills and fill rates", () => {
  expect(Object.keys(groupCandidatesBySeniority([]))).toHaveLength(5);
  expect(groupCandidatesBySeniority(sampleCandidates).Senior).toEqual([carolina]);
  expect(countCandidatesByStatus(sampleCandidates)).toEqual({ Active: 3, "In process": 0, Hired: 0, Inactive: 0 });
  expect(calculateAverageSalary(sampleCandidates)).toBe(4500);
  expect(calculateAverageSalary([])).toBe(0);
  expect(findTopSkills(sampleCandidates, 2)).toEqual([{ skill: "Node.js", count: 2 }, { skill: "PostgreSQL", count: 2 }]);
  expect(findTopSkills([], 5)).toEqual([]);
  const process = (stage: SelectionProcess["stage"]): SelectionProcess => ({
    id: stage, candidateId: maria.id, vacancyId: sampleVacancy.id, stage,
    score: 80, notes: "", createdAt: new Date(), updatedAt: new Date(),
  });
  expect(calculateVacancyFillRate([process("Hired"), process("Rejected"), process("Offer")])).toBe(33.33);
  expect(calculateVacancyFillRate([])).toBe(0);
});

test("validations enforce candidate and vacancy business rules", () => {
  expect(validateCandidate(maria)).toEqual({ valid: true, errors: [] });
  expect(validateVacancy(sampleVacancy)).toEqual({ valid: true, errors: [] });
  expect(isValidEmail("a@b.co")).toBe(true);
  expect(isValidEmail("a@b")).toBe(false);
  expect(validateCandidate({ ...maria, email: "invalid", phone: " ", skills: [], yearsOfExperience: 51, currentSalary: 0, expectedSalary: 0 }).errors).toHaveLength(6);
  expect(validateVacancy({ ...sampleVacancy, requiredSkills: [], minYearsExperience: -1, maxYearsExperience: -2, salaryRangeMin: 0, salaryRangeMax: -1 }).errors).toHaveLength(5);
});
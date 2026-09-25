import { sampleCandidates, sampleVacancy } from "./types/models.js";
import { filterCandidatesBySkills, sortCandidatesBySalary } from "./utils/collections.js";
import { binarySearchCandidateBySalary, findCandidateByEmail, findCandidateById } from "./utils/search.js";
import {
  calculateAverageSalary, countCandidatesByStatus, findTopSkills,
  groupCandidatesBySeniority, rankCandidatesForVacancy,
} from "./utils/transformations.js";
import { validateCandidate, validateVacancy } from "./utils/validations.js";

console.log("Matching skills:", filterCandidatesBySkills(sampleCandidates, sampleVacancy.requiredSkills));
console.log("Ranked candidates:", rankCandidatesForVacancy(sampleCandidates, sampleVacancy));
console.log("By seniority:", groupCandidatesBySeniority(sampleCandidates));
console.log("By status:", countCandidatesByStatus(sampleCandidates));
console.log("Average expected salary:", calculateAverageSalary(sampleCandidates));
console.log("Top skills:", findTopSkills(sampleCandidates, 3));
console.log("Find by ID:", findCandidateById(sampleCandidates, "C-2024-0451"));
console.log("Find by email:", findCandidateByEmail(sampleCandidates, "MARIA.GONZALEZ@EMAIL.COM"));
console.log("Salary index:", binarySearchCandidateBySalary(sortCandidatesBySalary(sampleCandidates, "asc"), 6500));
console.log("Candidate validation:", validateCandidate(sampleCandidates[0]!));
console.log("Vacancy validation:", validateVacancy(sampleVacancy));

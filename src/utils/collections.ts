import type { Candidate, Client } from "../types/models.js";
export function filterCandidatesByDepartment(candidates: Candidate[], department: Candidate["department"]): Candidate[] { return candidates.filter(c => c.department === department); }
export function sortCandidatesByExperience(candidates: Candidate[], ascending: boolean = true): Candidate[] { return [...candidates].sort((a, b) => ascending ? a.experienceYears - b.experienceYears : b.experienceYears - a.experienceYears); }

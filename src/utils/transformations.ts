import type {
  Candidate, CandidateStatus, EnglishLevel, SelectionProcess, SeniorityLevel, Vacancy,
} from "../types/models.js";

const seniorityLevels: SeniorityLevel[] = ["Junior", "Semi-Senior", "Senior", "Lead", "Executive"];
const englishLevels: EnglishLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
const candidateStatuses: CandidateStatus[] = ["Active", "In process", "Hired", "Inactive"];

export function calculateCandidateScore(candidate: Candidate, vacancy: Vacancy): number {
  const skills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
  const requiredMatches = vacancy.requiredSkills.filter((skill) => skills.has(skill.toLowerCase())).length;
  const requiredPoints = vacancy.requiredSkills.length > 0 && requiredMatches === vacancy.requiredSkills.length
    ? 40
    : vacancy.requiredSkills.length > 0 && requiredMatches / vacancy.requiredSkills.length >= 0.5 ? 20 : 0;
  const preferredMatches = vacancy.preferredSkills.filter((skill) => skills.has(skill.toLowerCase())).length;
  const skillPoints = Math.min(40, requiredPoints + Math.min(20, preferredMatches * 10));

  const experience = candidate.yearsOfExperience;
  const distance = experience < vacancy.minYearsExperience
    ? vacancy.minYearsExperience - experience
    : Math.max(0, experience - vacancy.maxYearsExperience);
  const experiencePoints = distance === 0 ? 20 : distance <= 2 ? 10 : 0;

  const seniorityDistance = Math.abs(seniorityLevels.indexOf(candidate.seniority) - seniorityLevels.indexOf(vacancy.requiredSeniority));
  const seniorityPoints = seniorityDistance === 0 ? 15 : seniorityDistance === 1 ? 7 : 0;
  const englishPoints = englishLevels.indexOf(candidate.englishLevel) >= englishLevels.indexOf(vacancy.requiredEnglishLevel) ? 15 : 0;
  const salaryPoints = candidate.expectedSalary >= vacancy.salaryRangeMin && candidate.expectedSalary <= vacancy.salaryRangeMax
    ? 10 : candidate.expectedSalary > vacancy.salaryRangeMax && candidate.expectedSalary <= vacancy.salaryRangeMax * 1.2 ? 5 : 0;

  return skillPoints + experiencePoints + seniorityPoints + englishPoints + salaryPoints;
}

export function rankCandidatesForVacancy(candidates: Candidate[], vacancy: Vacancy): Array<{ candidate: Candidate; score: number }> {
  return candidates.map((candidate) => ({ candidate, score: calculateCandidateScore(candidate, vacancy) }))
    .sort((left, right) => right.score - left.score);
}

export function groupCandidatesBySeniority(candidates: Candidate[]): Record<SeniorityLevel, Candidate[]> {
  const groups = seniorityLevels.reduce((result, level) => {
    result[level] = [];
    return result;
  }, {} as Record<SeniorityLevel, Candidate[]>);
  for (const candidate of candidates) {
    groups[candidate.seniority].push(candidate);
  }
  return groups;
}

export function countCandidatesByStatus(candidates: Candidate[]): Record<CandidateStatus, number> {
  const counts = Object.fromEntries(candidateStatuses.map((status) => [status, 0])) as Record<CandidateStatus, number>;
  for (const candidate of candidates) {
    counts[candidate.status]++;
  }
  return counts;
}

export function calculateAverageSalary(candidates: Candidate[]): number {
  if (candidates.length === 0) return 0;
  const sum = candidates.reduce((total, candidate) => total + candidate.expectedSalary, 0);
  return Math.round((sum / candidates.length) * 100) / 100;
}

export function findTopSkills(candidates: Candidate[], topN: number): Array<{ skill: string; count: number }> {
  const counts = new Map<string, { skill: string; count: number }>();
  for (const candidate of candidates) {
    const seen = new Set<string>();
    for (const skill of candidate.skills) {
      const key = skill.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const current = counts.get(key);
      counts.set(key, { skill: current?.skill ?? skill, count: (current?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.skill.localeCompare(right.skill))
    .slice(0, Math.max(0, topN));
}

export function calculateVacancyFillRate(processes: SelectionProcess[]): number {
  if (processes.length === 0) return 0;
  return Math.round(processes.filter((process) => process.stage === "Hired").length / processes.length * 10000) / 100;
}

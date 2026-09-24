import type { Candidate, Client } from "../types/models.js";
export function getAverageExperience(candidates: Candidate[]): number { if (candidates.length === 0) return 0; const total = candidates.reduce((acc, curr) => acc + curr.experienceYears, 0); return total / candidates.length; }
export function getTotalClientRevenue(clients: Client[]): number { return clients.filter(c => c.activeContract).reduce((acc, curr) => acc + curr.monthlyValue, 0); }

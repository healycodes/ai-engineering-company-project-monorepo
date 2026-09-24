import type { Candidate } from "./types/models.js";
import { validateCandidate } from "./utils/validations.js";
const testCandidate: Candidate = { id: "C-001", name: "Jane Doe", email: "jane.doe@example.com", department: "Talent", experienceYears: 5, status: "Applied", score: 85 };
console.log("Testing Candidate Validation:", validateCandidate(testCandidate));

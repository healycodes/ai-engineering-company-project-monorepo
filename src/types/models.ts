export interface Candidate { id: string; name: string; email: string; department: "Talent" | "Training" | "Support" | "Sales"; experienceYears: number; status: "Applied" | "Screening" | "Interviewed" | "Hired"; score: number; }
export interface Client { id: string; companyName: string; industry: "Technology" | "Retail" | "Finance"; activeContract: boolean; monthlyValue: number; }

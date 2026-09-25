import { sampleCandidates, sampleVacancy } from "./sampleData.js";
import type { Candidate, SeniorityLevel } from "./types/models.js";
import { filterCandidatesBySeniority, sortByField, sortCandidatesByExperience, sortCandidatesBySalary } from "./utils/collections.js";
import { binarySearchCandidateBySalary, findCandidateById } from "./utils/search.js";
import { calculateAverageSalary, calculateCandidateScore, countCandidatesByStatus, groupCandidatesBySeniority, rankCandidatesForVacancy } from "./utils/transformations.js";
import { validateCandidate } from "./utils/validations.js";

const candidates: Candidate[] = sampleCandidates;

let visibleCandidates: Candidate[] = [...candidates];
let searchMethod: "linear" | "binary" = "linear";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element #${id} was not found.`);
  }
  return element as T;
}

const tableBody = getElement<HTMLTableSectionElement>("candidate-table-body");
const resultCount = getElement<HTMLElement>("result-count");
const emptyState = getElement<HTMLElement>("empty-state");
const operationBadge = getElement<HTMLElement>("active-operation");
const resultMessage = getElement<HTMLElement>("result-message");
const seniorityFilter = getElement<HTMLSelectElement>("seniority-filter");
const sortSelect = getElement<HTMLSelectElement>("sort-select");
const searchInput = getElement<HTMLInputElement>("search-id");

function statusClasses(status: Candidate["status"]): string {
  const classes: Record<Candidate["status"], string> = {
    Active: "bg-amber-100 text-amber-800",
    "In process": "bg-sky-100 text-sky-800",
    Hired: "bg-emerald-100 text-emerald-800",
    Inactive: "bg-zinc-100 text-zinc-800",
  };
  return classes[status];
}

function renderCandidates(items: Candidate[]): void {
  resultCount.textContent = String(items.length);
  emptyState.classList.toggle("hidden", items.length > 0);
  tableBody.classList.toggle("hidden", items.length === 0);
  tableBody.innerHTML = items.map((candidate) => {
    const validation = validateCandidate(candidate);
    return `
      <tr class="reveal hover:bg-mist/40" data-candidate-id="${candidate.id}">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <span class="grid h-9 w-9 shrink-0 place-items-center bg-mist font-display text-xs font-bold text-pine">${candidate.fullName.split(" ").map((part) => part[0]).join("")}</span>
            <div><p class="font-semibold">${candidate.fullName}</p><p class="text-xs text-ink/45">${candidate.id} · ${candidate.email}</p></div>
          </div>
        </td>
        <td class="px-5 py-4">${candidate.seniority}</td>
        <td class="px-5 py-4">${candidate.yearsOfExperience} years</td>
        <td class="px-5 py-4"><span class="px-2 py-1 text-xs font-semibold ${statusClasses(candidate.status)}">${candidate.status}</span></td>
        <td class="px-5 py-4 text-right"><span class="font-display text-lg font-bold">${calculateCandidateScore(candidate, sampleVacancy)}</span><span class="text-xs text-ink/40"> / 100</span>${validation.valid ? "" : '<i class="fa-solid fa-triangle-exclamation ml-2 text-coral"></i>'}</td>
      </tr>`;
  }).join("");
}

function setResult(operation: string, message: string): void {
  operationBadge.textContent = operation;
  resultMessage.textContent = message;
}

function applySort(items: Candidate[]): Candidate[] {
  switch (sortSelect.value) {
    case "experience-asc": return sortCandidatesByExperience(items, "asc");
    case "experience-desc": return sortCandidatesByExperience(items, "desc");
    case "salary-asc": return sortCandidatesBySalary(items, "asc");
    case "score-desc": return rankCandidatesForVacancy(items, sampleVacancy).map(({ candidate }) => candidate);
    case "name": return sortByField(items, "fullName", true);
    default: return sortByField(items, "id", true);
  }
}

function applyView(): void {
  const seniority = seniorityFilter.value;
  const filtered = seniority === "All"
    ? [...candidates]
    : filterCandidatesBySeniority(candidates, seniority as SeniorityLevel);
  visibleCandidates = applySort(filtered);
  renderCandidates(visibleCandidates);
  setResult("View updated", `${visibleCandidates.length} candidate${visibleCandidates.length === 1 ? "" : "s"} match the current controls.`);
}

function runSearch(): void {
  const query = searchInput.value.trim();
  if (!query) {
    setResult("Search", `Enter a candidate ${searchMethod === "linear" ? "ID" : "salary"} before searching.`);
    searchInput.focus();
    return;
  }

  let found: Candidate | null = null;
  let detail = "";
  if (searchMethod === "linear") {
    found = findCandidateById(candidates, query.toUpperCase());
    detail = "Linear search scanned the unsorted collection.";
  } else {
    const sortedCandidates = sortCandidatesBySalary(candidates, "asc");
    const index = query && Number.isFinite(Number(query)) ? binarySearchCandidateBySalary(sortedCandidates, Number(query)) : -1;
    found = index >= 0 ? sortedCandidates[index] ?? null : null;
    detail = `Binary search used the salary-sorted collection${index >= 0 ? ` and returned index ${index}` : ""}.`;
  }

  visibleCandidates = found ? [found] : [];
  renderCandidates(visibleCandidates);
  setResult(`${searchMethod === "linear" ? "Linear" : "Binary"} search`, found ? `${found.fullName} (${found.id}) found. ${detail}` : `${query} was not found. ${detail}`);
}

function generateReport(): void {
  const scores = rankCandidatesForVacancy(visibleCandidates, sampleVacancy);
  const counts = countCandidatesByStatus(visibleCandidates);
  getElement<HTMLElement>("average-score").textContent = scores.length ? (scores.reduce((sum, item) => sum + item.score, 0) / scores.length).toFixed(1) : "0";
  getElement<HTMLElement>("average-experience").textContent = String(calculateAverageSalary(visibleCandidates));
  getElement<HTMLElement>("highest-score").textContent = String(scores[0]?.score ?? 0);
  getElement<HTMLElement>("hired-count").textContent = String(counts.Hired);

  const report = getElement<HTMLElement>("seniority-report");
  report.innerHTML = Object.entries(groupCandidatesBySeniority(visibleCandidates)).filter(([, group]) => group.length).map(([seniority, group]) => {
    const percentage = Math.round((group.length / visibleCandidates.length) * 100);
    return `<div><div class="mb-1 flex justify-between text-xs"><span>${seniority}</span><span class="text-white/50">${group.length}</span></div><div class="h-1.5 bg-white/10"><div class="h-full bg-coral" style="width:${percentage}%"></div></div></div>`;
  }).join("") || '<p class="text-sm text-white/50">No records to aggregate.</p>';
  setResult("Report generated", `Aggregated ${visibleCandidates.length} visible candidate${visibleCandidates.length === 1 ? "" : "s"}.`);
}

seniorityFilter.addEventListener("change", applyView);
sortSelect.addEventListener("change", applyView);
getElement<HTMLButtonElement>("search-button").addEventListener("click", runSearch);
searchInput.addEventListener("keydown", (event) => { if (event.key === "Enter") runSearch(); });
getElement<HTMLButtonElement>("report-button").addEventListener("click", generateReport);
getElement<HTMLButtonElement>("reset-button").addEventListener("click", () => {
  seniorityFilter.value = "All";
  sortSelect.value = "id";
  searchInput.value = "";
  applyView();
  generateReport();
  setResult("Reset", "The full candidate dataset is visible again.");
});

document.querySelectorAll<HTMLButtonElement>(".search-method").forEach((button) => {
  button.addEventListener("click", () => {
    searchMethod = button.dataset.method === "binary" ? "binary" : "linear";
    searchInput.placeholder = searchMethod === "binary" ? "6500" : "C-2024-0451";
    document.querySelectorAll<HTMLButtonElement>(".search-method").forEach((option) => {
      const active = option === button;
      option.classList.toggle("bg-ink", active);
      option.classList.toggle("text-white", active);
      option.classList.toggle("text-ink/60", !active);
    });
    setResult("Method selected", `${searchMethod === "linear" ? "Linear" : "Binary"} search is active.`);
  });
});

renderCandidates(visibleCandidates);
generateReport();
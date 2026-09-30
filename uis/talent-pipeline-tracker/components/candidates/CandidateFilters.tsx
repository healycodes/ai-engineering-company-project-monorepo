"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePipelineQuery } from "@/hooks/usePipelineQuery";
import { STAGE_OPTIONS, STATUS_OPTIONS } from "@/lib/pipeline";

export function CandidateFilters() {
  const { filters, setParams, clearAll, activeCount } = usePipelineQuery();
  const [searchText, setSearchText] = useState(filters.search ?? "");
  const debouncedSearch = useDebouncedValue(searchText.trim());

  // Push the (debounced) search box into the URL.
  useEffect(() => {
    if ((filters.search ?? "") !== debouncedSearch) {
      setParams({ search: debouncedSearch || null });
    }
    // Only react to what the user typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Search candidates</span>
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Name or email…"
          className="field"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Process status</span>
        <select
          value={filters.status ?? ""}
          onChange={(e) => setParams({ status: e.target.value || null })}
          className="field sm:w-52"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Selection stage</span>
        <select
          value={filters.stage ?? ""}
          onChange={(e) => setParams({ stage: e.target.value || null })}
          className="field sm:w-52"
        >
          <option value="">All stages</option>
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => {
          setSearchText("");
          clearAll();
        }}
        disabled={activeCount === 0}
        className="btn btn-secondary"
      >
        Clear{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
    </form>
  );
}

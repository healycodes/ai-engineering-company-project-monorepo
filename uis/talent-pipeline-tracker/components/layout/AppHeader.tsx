import Link from "next/link";

export function AppHeader() {
  return (
    <header className="bg-nexova text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-lg font-bold">
            N
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Nexova Talent Pipeline</span>
            <span className="block text-xs text-white/70">Talent Selection Operations</span>
          </span>
        </Link>
        <Link
          href="/candidates/new"
          className="btn bg-white text-nexova hover:bg-white/90"
        >
          <span aria-hidden>＋</span>
          <span className="hidden sm:inline">Register candidate</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>
    </header>
  );
}

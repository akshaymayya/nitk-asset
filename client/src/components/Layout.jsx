import { Link } from "react-router-dom";
import { APP_TITLE, COLLEGE_NAME } from "../config";

export function AppShell({ children, title, backTo, actions }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {backTo && (
              <Link
                to={backTo}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-ink-600 hover:bg-slate-100"
              >
                ← Back
              </Link>
            )}
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-ink-900">{title || APP_TITLE}</div>
              <div className="truncate text-xs text-ink-400">{COLLEGE_NAME}</div>
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-card ${className}`}>
      {children}
    </div>
  );
}

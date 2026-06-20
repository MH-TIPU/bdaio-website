import { ScrollToTop } from "./ScrollToTop";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-100 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-slate-500 tracking-tight">
          Copyright © Bangladesh Artificial Intelligence Olympiad 2026
        </p>
      </div>
      <ScrollToTop />
    </footer>
  );
}

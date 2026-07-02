import { ScrollToTop } from "./ScrollToTop";

export function Footer() {
  return (
    <footer className="site-footer relative border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-bdaio-gray tracking-tight">
          Copyright © Bangladesh Artificial Intelligence Olympiad 2026
        </p>
      </div>
      <ScrollToTop />
    </footer>
  );
}

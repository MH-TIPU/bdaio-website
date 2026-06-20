import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
};

const mockStandings = [
  { rank: 1, name: "Misbah Uddin Inan", institution: "Notre Dame College", category: "AI Problem Solving", award: "Gold Medal & IOAI Team" },
  { rank: 2, name: "Arefin Anwar", institution: "Saint Joseph Higher Secondary School", category: "AI Problem Solving", award: "Silver Medal & IOAI Team" },
  { rank: 3, name: "Abrar Shahid", institution: "Notre Dame College", category: "AI Problem Solving", award: "Silver Medal & IOAI Team" },
  { rank: 4, name: "Rafid Ahmed", institution: "Academia, Lalmatia", category: "AI Problem Solving", award: "Bronze Medal & IOAI Team" },
  { rank: 5, name: "Tasnim Rahman", institution: "Viqarunnisa Noon School & College", category: "AI Quiz Segment", award: "National Winner (Quiz)" },
  { rank: 6, name: "Sadman Sakib", institution: "Dhaka College", category: "AI Quiz Segment", award: "National Runner-Up (Quiz)" },
];

export default function ResultPage() {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-black text-[#1e5a8a] sm:text-5xl">
            Competition Results
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Official standing of winners and international representatives.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded bg-blue-500" />
        </div>

        {/* Notice Info Box */}
        <div className="mx-auto max-w-3xl mb-12 rounded-2xl border border-blue-100 bg-blue-50/40 p-6 text-center shadow-xs">
          <h3 className="text-base font-bold text-[#1e5a8a] mb-1.5">BdAIO 2026 Results</h3>
          <p className="text-sm text-slate-550 leading-relaxed max-w-2xl mx-auto">
            Official BdAIO 2026 results and national standings will be published here in May 2026 after the Selection Camp. Follow our WhatsApp community for instant result alerts.
          </p>
        </div>

        {/* Standings Table Card */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">BdAIO 2025 Final Standings Reference</h3>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-650">Archived</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/30">
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Contestant Name</th>
                  <th className="py-4 px-6">Institution</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Award Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {mockStandings.map((row) => (
                  <tr key={row.rank} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 text-center font-bold text-slate-800">
                      {row.rank === 1 ? (
                        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-yellow-100 text-yellow-800 text-xs font-black">1</span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs font-black">2</span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-orange-100 text-orange-800 text-xs font-black">3</span>
                      ) : (
                        row.rank
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-750">{row.name}</td>
                    <td className="py-4 px-6 text-slate-500 font-semibold">{row.institution}</td>
                    <td className="py-4 px-6 text-xs font-bold uppercase tracking-wider">
                      <span className={`inline-flex rounded-full px-2 py-0.5 ${row.category.includes("Solving") ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {row.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-[#1e5a8a]">{row.award}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

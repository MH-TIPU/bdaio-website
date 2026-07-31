export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-bdaio-gray-light px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

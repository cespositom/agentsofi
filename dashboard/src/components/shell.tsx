import { Sidebar } from "./sidebar";

export function Shell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar email={email} />
      <main className="flex-1 pl-64">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

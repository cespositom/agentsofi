import { TopNav } from "./topnav";

export function Shell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav email={email} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

import { TopNav } from "@/components/TopNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopNav hitlBadge={3} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

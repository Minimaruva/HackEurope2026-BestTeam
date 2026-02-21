import { NavLink as RouterNavLink } from "react-router-dom";

interface TopNavProps {
  hitlBadge?: number;
}


export function TopNav(_props: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center h-14 px-6">
        <RouterNavLink to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            ContractOps
          </span>
        </RouterNavLink>
      </div>
    </header>
  );
}

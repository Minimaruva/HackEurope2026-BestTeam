import { NavLink } from "@/components/NavLink";
import {
  GitBranch,
  Database,
  FlaskConical,
  ClipboardCheck,
  Settings,
  Zap,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { title: "Workflow Canvas", url: "/", icon: GitBranch },
  { title: "Data Sources", url: "/data-sources", icon: Database },
  { title: "Recipe Builder", url: "/recipe-builder", icon: FlaskConical },
  { title: "Global HITL Inbox", url: "/hitl-inbox", icon: ClipboardCheck, badge: 3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <Zap className="h-5 w-5 text-sidebar-primary" />
        <span className="text-base font-bold text-sidebar-accent-foreground tracking-tight">
          Agentic Ops
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-danger text-danger-foreground text-xs font-semibold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ROI Tracker Widget */}
      <div className="mx-3 mb-4 p-3 rounded-lg bg-sidebar-accent border border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-sidebar-muted" />
          <span className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
            paid.ai ROI
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-sidebar-foreground">Token Burn</span>
            <span className="text-danger font-semibold">$12.40</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-sidebar-foreground">Value Generated</span>
            <span className="text-success font-semibold">$3,150</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-sidebar-border">
            <span className="text-sidebar-foreground font-medium">ROI</span>
            <span className="text-sidebar-accent-foreground font-bold">254x</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

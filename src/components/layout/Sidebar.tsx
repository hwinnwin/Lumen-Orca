import { NavLink } from "react-router-dom";
import { Activity, Box, FileText, BarChart3, Network, Terminal } from "lucide-react";
import lumenLogo from "@/assets/lumen-logo.png";

const navItems = [
  { title: "Orchestration", path: "/", icon: Network },
  { title: "Agents", path: "/agents", icon: Activity },
  { title: "Contracts", path: "/contracts", icon: Box },
  { title: "Evidence", path: "/evidence", icon: FileText },
  { title: "Telemetry", path: "/telemetry", icon: BarChart3 },
  { title: "Master Prompt", path: "/prompt", icon: Terminal },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-border surface-elevated flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={lumenLogo} alt="Lumen" className="w-10 h-10 glow-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">Lumen</h1>
            <p className="text-xs text-muted-foreground font-mono">v1.0.0-alpha</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-primary font-mono">OPERATIONAL</span>
            </div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            F<sub>total</sub> = 10<sup>-6</sup>
          </div>
        </div>
      </div>
    </aside>
  );
};

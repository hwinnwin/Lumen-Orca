import { NavLink } from "react-router-dom";
import { Activity, Box, FileText, BarChart3, Network, Terminal, BookOpen, Presentation, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import lumenLogo from "@/assets/lumen-logo.png";

const navItems = [
  { title: "Orchestration", path: "/", icon: Network },
  { title: "Agents", path: "/agents", icon: Activity },
  { title: "Contracts", path: "/contracts", icon: Box },
  { title: "Evidence", path: "/evidence", icon: FileText },
  { title: "Telemetry", path: "/telemetry", icon: BarChart3 },
  { title: "User Guide", path: "/guide", icon: BookOpen },
  { title: "Demo Plan", path: "/demo", icon: Presentation },
  { title: "Master Prompt", path: "/prompt", icon: Terminal },
  { title: "Settings", path: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const { user, roles, isAdmin, signOut } = useAuth();

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Admin</Badge>;
    if (roles.includes('developer')) return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">Dev</Badge>;
    return <Badge variant="outline" className="text-xs">Viewer</Badge>;
  };

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

      {/* User Menu */}
      {user && (
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-smooth cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <div className="flex items-center gap-1">
                    {getRoleBadge()}
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <NavLink to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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

import { Link } from "react-router-dom";
import { Home, Briefcase, Compass, FolderOpen, Trash2, Package } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/placement", icon: Briefcase, label: "Place Item" },
  { to: "/recommendation", icon: Compass, label: "Recommendation" },
  { to: "/retrieve", icon: FolderOpen, label: "Search & Retrieve" },
  { to: "/waste", icon: Trash2, label: "Waste" },
  { to: "/details", icon: Package, label: "Container Details" },
];

export function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex items-center gap-6 px-8 py-3 rounded-full bg-card shadow-md border">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors",
        "px-3 py-2 rounded-md hover:bg-accent group"
      )}
    >
      <Icon className="w-5 h-5 group-hover:text-primary transition-colors" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
} 
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  Truck,
  ShoppingBag,
  PackageCheck,
  Percent,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/marchands", label: "Restaurants & Boutiques", icon: Store, exact: false },
  { to: "/admin/comptes", label: "Comptes marchands", icon: Users, exact: false },
  { to: "/admin/transporteurs", label: "Entreprises de livraison", icon: Truck, exact: false },
  { to: "/admin/commandes", label: "Commandes", icon: ShoppingBag, exact: false },
  { to: "/admin/livraisons", label: "Livraisons", icon: PackageCheck, exact: false },
  { to: "/admin/commissions", label: "Commissions", icon: Percent, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/admin/parametres", label: "Paramètres", icon: Settings, exact: false },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <img src={logo} alt="GoLivra" className="h-9 w-9 object-contain" />
        <span className="text-lg font-bold tracking-tight text-foreground">
          Go<span className="text-accent">Livra</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">© GoLivra Admin</p>
      </div>
    </aside>
  );
}

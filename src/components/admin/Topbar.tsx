import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchAdminMe, logoutAdmin } from "@/lib/auth-api";

function initials(nom?: string | null, email?: string | null): string {
  if (nom?.trim()) {
    const parts = nom.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nom.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "AD";
}

export function Topbar() {
  const navigate = useNavigate();
  const meQuery = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => fetchAdminMe(),
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    await logoutAdmin();
    await navigate({ to: "/login" });
  };

  const me = meQuery.data;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher…" className="pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(me?.nom, me?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="max-w-[140px] truncate text-sm font-medium text-foreground">{me?.nom || "Admin"}</p>
            <p className="max-w-[140px] truncate text-xs text-muted-foreground">{me?.email || "—"}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={() => void handleLogout()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

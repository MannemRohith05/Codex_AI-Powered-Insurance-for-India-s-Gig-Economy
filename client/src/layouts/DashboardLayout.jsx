import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Shield, History, Wallet, User } from "lucide-react";
import { cn } from "../utils/cn";

export function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Coverage", href: "/dashboard/coverage", icon: Shield },
    { name: "Claims", href: "/dashboard/claims", icon: History },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold tracking-tight text-zinc-900">GigShield</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 overflow-hidden">
              <User className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] px-4 md:px-8 py-6 gap-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <nav className="flex flex-col gap-2 pt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary-50 text-primary-700" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex w-full flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 z-40 flex h-16 w-full border-t border-zinc-200 bg-white md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary-600" : "text-zinc-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

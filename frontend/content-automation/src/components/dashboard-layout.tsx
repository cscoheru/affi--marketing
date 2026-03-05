"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  FileText,
  Database,
  Send,
  BarChart3,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/products", icon: Package, label: "产品候选库" },
  { href: "/materials", icon: Database, label: "素材库" },
  { href: "/content", icon: FileText, label: "内容管理" },
  { href: "/publish", icon: Send, label: "发布中心" },
  { href: "/analytics", icon: BarChart3, label: "数据看板" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-muted/40">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background">
          <div className="flex h-16 items-center border-b px-6">
            <Sparkles className="mr-2 h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ContentHub</span>
          </div>

          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <h1 className="text-xl font-semibold">
              {navItems.find((item) => item.href === pathname)?.label || "ContentHub"}
            </h1>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

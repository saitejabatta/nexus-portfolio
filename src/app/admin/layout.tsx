"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import { adminSignOut, useAdminAuth } from "@/lib/admin/useAdminAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Folder },
  { href: "/admin/skills", label: "Skills", icon: Sparkles },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/profile", label: "Profile & résumé", icon: User },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAdmin } = useAdminAuth();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !isAdmin && !isLoginPage) router.replace("/admin/login");
  }, [loading, isAdmin, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg-base">
        <p className="font-mono text-xs text-text-faint">checking session…</p>
      </main>
    );
  }

  if (!isAdmin) return null; // redirecting

  return (
    <div className="flex min-h-dvh bg-bg-base">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line px-3 py-5">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="font-display text-sm font-semibold tracking-widest text-text">
            NEXUS
          </span>
          <span className="rounded border border-cyan/30 px-1.5 py-0.5 font-mono text-[9px] text-cyan">
            admin
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors",
                  active
                    ? "bg-cyan/10 text-cyan"
                    : "text-text-muted hover:bg-white/5 hover:text-text",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs text-text-muted hover:bg-white/5 hover:text-text"
          >
            <FileText className="h-3.5 w-3.5" />
            View live site
          </Link>
          <button
            onClick={async () => {
              await adminSignOut();
              router.replace("/admin/login");
            }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left font-mono text-xs text-text-muted hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/app/components/session-utils";

type NavItem = { label: string; href: string };

type PortalShellProps = {
  role: "patient" | "doctor";
  heading: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

function NavIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const cls = "h-4 w-4 shrink-0";

  if (l.includes("overview"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );

  if (l.includes("vital") || l.includes("daily") || l.includes("weekly") || l.includes("pulse"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12h3l3-7 4 14 3-7h5" />
      </svg>
    );

  if (l.includes("medication"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 11h16a1 1 0 0 1 1 1v1a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-1a1 1 0 0 1 1-1z" />
        <path d="M12 4v7M9 11V7m6 4V7" />
      </svg>
    );

  if (l.includes("history") || (l.includes("medical") && !l.includes("advice")))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 3h6v4H9z" /><path d="M8 12h8M8 16h5" />
      </svg>
    );

  if (l.includes("lab"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 3v8l-4 8h14l-4-8V3" /><path d="M9 3h6" /><path d="M6 17h12" />
      </svg>
    );

  if (l.includes("advice") || l.includes("comment"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );

  if (l.includes("device"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="7" y="2" width="10" height="20" rx="2" /><path d="M10 6h4M10 10h4M10 14h2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </svg>
    );

  if (l.includes("log"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M8 12h8M8 16h5" />
      </svg>
    );

  if (l.includes("prescription"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 3h6v4H9z" /><path d="M9 13l6 6M15 13l-6 6" />
      </svg>
    );

  if (l.includes("patient"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="7" r="3" /><path d="M2 20a6 6 0 0 1 12 0" />
        <path d="M16 11v6M13 14h6" />
      </svg>
    );

  if (l.includes("profile"))
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" /><path d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    );

  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function PortalShell({ role, heading, navItems, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const userName = useMemo(() => {
    const session = getSession();
    return session?.role === role ? session.name : "";
  }, [role]);

  const profileItem = useMemo(
    () => navItems.find((item) => item.label.toLowerCase().includes("profile")),
    [navItems],
  );
  const mainNavItems = useMemo(
    () => navItems.filter((item) => !item.label.toLowerCase().includes("profile")),
    [navItems],
  );

  const handleLogout = () => {
    localStorage.removeItem("omnicure_session");
    router.replace("/login");
  };

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handle = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node))
        setSidebarOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [sidebarOpen]);

  const topCls = (href: string) =>
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-[0.09em] uppercase transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap ${
      pathname === href
        ? "bg-[var(--primary-light)] text-[var(--primary)]"
        : "text-[var(--text-body)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)]"
    }`;

  const sideCls = (href: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      pathname === href
        ? "bg-[var(--primary-light)] text-[var(--primary)]"
        : "text-[var(--text-body)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)]"
    }`;

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 border-b border-[var(--border)] backdrop-blur-md flex items-center justify-between gap-2 px-4"
        style={{ boxShadow: "0 0.597px 1.314px -1px rgb(6 125 140 / 0.2), 0 1.811px 3.984px -2px rgb(6 125 140 / 0.14)" }}>

        {/* Logo button opens sidebar */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="shrink-0 flex items-center rounded-lg px-1 py-1 hover:bg-[var(--surface)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          aria-label="Open navigation"
        >
          <Image src="/logo.png" alt="OmniCure" width={156} height={52} className="h-10 w-auto object-contain" priority />
        </button>

        <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
          <div className="h-5 w-px bg-[var(--border)] shrink-0 mx-1" />

          {/* Scrollable nav */}
          <nav className="topbar-nav flex items-center justify-end gap-1 overflow-x-auto max-w-[62vw] min-w-0 shrink">
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={topCls(item.href)} title={item.label}>
                <NavIcon label={item.label} />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Profile pinned */}
          {profileItem && (
            <Link href={profileItem.href} className={`${topCls(profileItem.href)} shrink-0`} title={profileItem.label}>
              <NavIcon label={profileItem.label} />
              <span className="hidden xl:inline">{profileItem.label}</span>
            </Link>
          )}

          <div className="h-5 w-px bg-[var(--border)] shrink-0 mx-1" />

          {/* Log out */}
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--text-body)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap"
            title="Log out"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden xl:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar drawer */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderRight: "1px solid var(--border)", boxShadow: "0 15px 33px -4px rgb(6 125 140 / 0.14)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
          <Image src="/logo.png" alt="OmniCure" width={156} height={52} className="h-11 w-auto object-contain" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            aria-label="Close navigation"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[var(--primary)]">
                {(userName || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-heading)] truncate">{userName || "Clinical User"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="status-dot" />
                <span className="text-xs text-[var(--text-muted)]">Authenticated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {mainNavItems.map((item) => (
            <Link key={item.href} href={item.href} className={sideCls(item.href)}>
              <NavIcon label={item.label} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile pinned at bottom */}
        {profileItem && (
          <div className="px-3 pt-2 shrink-0 border-t border-[var(--border)]">
            <Link href={profileItem.href} className={sideCls(profileItem.href)}>
              <NavIcon label={profileItem.label} />
              {profileItem.label}
            </Link>
          </div>
        )}

        {/* Log out */}
        <div className="px-3 pb-4 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-body)] hover:bg-[var(--surface)] hover:text-[var(--text-heading)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <div className="min-h-screen pt-14 surf-background">
        {/* Page header band */}
        <div className="bg-white/90 border-b border-[var(--border)] px-6 py-3 backdrop-blur-sm"
          style={{ boxShadow: "0 0.597px 1.314px -1px rgb(6 125 140 / 0.2), 0 1.811px 3.984px -2px rgb(6 125 140 / 0.2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">OmniCure Clinical Dashboard</p>
          <h1 className="mt-0.5 text-xl font-semibold text-[var(--text-heading)] tracking-tight">{heading}</h1>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6">
          {children}
        </div>
      </div>
    </>
  );
}


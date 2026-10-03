import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InstallAppButton } from "@/components/InstallAppButton";

export function AppHeader() {
  const { user, isAdmin, fullName } = useAuth();
  const navigate = useNavigate();

  const linkClass = "px-3.5 py-2 rounded-full font-medium hover:bg-foreground/5 transition-colors";
  const activeClass =
    "px-3.5 py-2 rounded-full bg-amber text-ink font-bold border border-border pop-ink";

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-foreground/15">
      <div className="mx-auto max-w-[1200px] px-5 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 shrink-0 overflow-hidden rounded-[10px] border border-border">
            <img
              src="/icons/icon-192.png"
              alt="شعار المنصة"
              className="w-full h-full object-cover"
            />
          </span>
          <span className="leading-tight">
            <span className="block font-display font-black text-base sm:text-lg">
              مدرسة سبح المعاشي (1-12)
            </span>
            <span className="block text-[11px] text-muted-foreground">
              مديرة المدرسة: الأستاذة موزة بدر المعني
            </span>
          </span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-1 overflow-x-auto">
            <Link to="/" activeOptions={{ exact: true }} className={linkClass} activeProps={{ className: activeClass }}>
              مكتبتي
            </Link>
            <Link to="/upload" className={linkClass} activeProps={{ className: activeClass }}>
              رفع ملف
            </Link>
            <Link to="/admin" className={linkClass} activeProps={{ className: activeClass }}>
              لوحة المدير
            </Link>
          </nav>
        ) : null}

        <div className="mr-auto flex items-center gap-3 shrink-0">
          <InstallAppButton />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-coral border border-border" />
                <span className="font-bold text-sm">
                  {fullName || user.user_metadata?.["username"] || "المعلمة"}
                  {isAdmin ? " · مديرة" : ""}
                </span>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  void navigate({ to: "/auth" });
                }}
                className="text-sm font-bold border border-border rounded-full px-3 py-1.5 bg-card hover:-translate-y-0.5 transition-transform"
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-bold border border-border rounded-full px-4 py-2 bg-amber pop-ink"
            >
              تسجيل الدخول
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

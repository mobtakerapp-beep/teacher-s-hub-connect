import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VisionMission } from "@/components/VisionMission";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { createUsernameAccount } from "@/lib/auth.functions";
import { usernameToAuthEmail } from "@/lib/usernameAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — منصة مدرسة سبح المعاشي" },
      { name: "description", content: "سجّلي الدخول للوصول إلى ملفاتك الخاصة على منصة خزانة." },
      { property: "og:title", content: "تسجيل الدخول — منصة مدرسة سبح المعاشي" },
      {
        property: "og:description",
        content: "سجّلي الدخول للوصول إلى ملفاتك الخاصة على منصة خزانة.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      const cleanUsername = username.trim();

      if (cleanUsername.length < 2) {
        toast.error("اكتبي اسم المستخدم.");
        return;
      }

      if (password.length < 6) {
        toast.error("كلمة المرور يجب ألا تقل عن ٦ أحرف.");
        return;
      }

      const authEmail = usernameToAuthEmail(cleanUsername);

      if (mode === "up") {
        await createUsernameAccount({
          data: { username: cleanUsername, password },
        });

        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) throw error;
        toast.success("تم إنشاء الحساب والدخول بنجاح.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
        }

        toast.success("تم تسجيل الدخول.");
      }

      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إتمام العملية.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full bg-card border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="mx-auto max-w-[1200px] px-5 pt-14 pb-4 text-center rise">
        <h1 className="font-display font-black text-5xl sm:text-6xl tracking-tight">
          كل عمل... له أثر
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-loose">
          منصة مدرسية توثّق أعمالك، وتنظم إنجازاتك،
          <br />
          وتجمع جهودك في مكان واحد.
        </p>
      </section>
      <VisionMission />
      <main className="mx-auto max-w-[520px] px-5 py-12">
        <h2 className="font-display font-black text-3xl tracking-tight mb-2">
          {mode === "in" ? "أهلًا بعودتك" : "إنشاء حساب معلمة"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          ملفاتك خاصة بك وحدك — لا تراها أي معلمة أخرى.
        </p>

        <form onSubmit={submit} className="card-ink pop-amber p-5 space-y-3">
          <label className="block text-xs font-bold">اسم المستخدم</label>
          <input
            className={inputClass}
            type="text"
            required
            minLength={2}
            maxLength={40}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اكتبي اسم المستخدم"
          />

          <label className="block text-xs font-bold">كلمة المرور</label>
          <input
            className={inputClass}
            type="password"
            required
            minLength={6}
            maxLength={72}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink text-paper rounded-full px-6 py-3 font-bold border border-border pop-amber transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy ? "لحظة..." : mode === "in" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 text-sm font-bold underline underline-offset-4"
        >
          {mode === "in" ? "ليس لديك حساب؟ أنشئي حسابًا" : "لديك حساب؟ سجّلي الدخول"}
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

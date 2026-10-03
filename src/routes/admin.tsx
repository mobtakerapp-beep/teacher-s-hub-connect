import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileCard, type FileRow } from "@/components/FileCard";
import { claimAdminCode } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة المدير — منصة مدرسة سبح المعاشي" },
      {
        name: "description",
        content: "دخول بكود المدير لعرض جميع المعلمات وملفاتهن في مكان واحد.",
      },
      { property: "og:title", content: "لوحة المدير — منصة مدرسة سبح المعاشي" },
      {
        property: "og:description",
        content: "دخول بكود المدير لعرض جميع المعلمات وملفاتهن في مكان واحد.",
      },
    ],
  }),
  component: AdminPage,
});

type TeacherRow = { id: string; full_name: string; count: number };

function AdminPage() {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const claim = useServerFn(claimAdminCode);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [selected, setSelected] = useState<TeacherRow | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [thanks, setThanks] = useState("");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void (async () => {
      const [profiles, allFiles] = await Promise.all([
        supabase.from("profiles").select("id,full_name"),
        supabase.from("files").select("user_id"),
      ]);
      if (!active) return;
      const counts: Record<string, number> = {};
      for (const f of allFiles.data ?? []) {
        counts[f.user_id] = (counts[f.user_id] ?? 0) + 1;
      }
      const rows = (profiles.data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name || "معلمة بدون اسم",
        count: counts[p.id] ?? 0,
      }));
      rows.sort((a, b) => b.count - a.count);
      setTeachers(rows);
      if (rows.length > 0) setSelected((prev) => prev ?? rows[0]!);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selected) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("files")
        .select("id,title,description,subject,category,grade,file_path,file_ext,file_size,video_url")
        .eq("user_id", selected.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setFiles((data as FileRow[]) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, selected]);

  async function openFile(file: FileRow) {
    if (file.file_path) {
      const { data, error } = await supabase.storage
        .from("teacher-files")
        .createSignedUrl(file.file_path, 300);
      if (error || !data) {
        toast.error("تعذّر فتح الملف.");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } else if (file.video_url) {
      window.open(file.video_url, "_blank", "noopener,noreferrer");
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await claim({ data: { code: code.trim() } });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر التحقق من الكود.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <p className="mx-auto max-w-[1200px] px-5 py-9 text-sm text-muted-foreground">
          جارٍ التحميل…
        </p>
        <SiteFooter />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <section className="mx-auto max-w-[520px] px-5 py-12">
          <h1 className="font-display font-black text-3xl tracking-tight mb-2 rise">لوحة المدير</h1>
          <p className="text-sm text-muted-foreground mb-6">
            أدخلي كود المدير لعرض جميع المعلمات وملفاتهن.
          </p>
          <form onSubmit={submitCode} className="card-ink pop-coral p-5 space-y-3">
            <label className="block text-xs font-bold">كود المدير</label>
            <input
              className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber"
              value={code}
              maxLength={200}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-coral text-paper rounded-full px-6 py-3 font-bold border border-border pop-ink transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "جارٍ التحقق…" : "دخول"}
            </button>
          </form>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="mx-auto max-w-[1200px] px-5 py-9">
        <div className="flex flex-wrap items-end gap-4 mb-6 rise">
          <h1 className="font-display font-black text-3xl tracking-tight">لوحة المدير</h1>
          <span className="text-muted-foreground pb-1">
            {teachers.length} معلمة — عرض شامل لجميع الملفات
          </span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            {teachers.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full text-right flex items-center gap-4 card-ink p-4 transition-transform duration-200 hover:-translate-y-0.5 ${
                  selected?.id === t.id ? "pop-amber" : ""
                }`}
              >
                <span className="w-11 h-11 rounded-full bg-coral border border-border grid place-items-center font-black text-paper">
                  {t.full_name.trim().charAt(0)}
                </span>
                <span>
                  <p className="font-bold">{t.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.count} ملفًا</p>
                </span>
                <span className="mr-auto font-black text-2xl bg-amber/20 border border-border rounded-xl px-3 py-1">
                  {t.count}
                </span>
              </button>
            ))}
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد معلمات مسجّلات بعد.</p>
            ) : null}
          </div>

          <div className="bg-ink text-paper rounded-2xl p-5 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-coral border-2 border-paper grid place-items-center font-black">
                {selected?.full_name.trim().charAt(0) ?? "—"}
              </span>
              <p className="font-bold">ملفات {selected?.full_name ?? "—"}</p>
            </div>
            {selected ? (
              <form
                className="mb-4 space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const msg = thanks.trim();
                  if (!msg || !user) return;
                  const { error } = await supabase
                    .from("thanks")
                    .insert({ teacher_id: selected.id, admin_id: user.id, message: msg.slice(0, 500) });
                  if (error) {
                    toast.error("تعذّر إرسال الشكر.");
                    return;
                  }
                  setThanks("");
                  toast.success(`تم إرسال الشكر إلى ${selected.full_name}`);
                }}
              >
                <textarea
                  className="w-full rounded-lg bg-paper text-ink text-sm p-2.5 outline-none"
                  rows={2}
                  maxLength={500}
                  value={thanks}
                  onChange={(e) => setThanks(e.target.value)}
                  placeholder="اكتبي رسالة شكر للمعلمة…"
                />
                <button className="w-full bg-amber text-paper rounded-full py-2 text-sm font-bold">
                  إرسال شكر 🌷
                </button>
              </form>
            ) : null}
            <div className="space-y-2 text-xs">
              {files.length === 0 ? (
                <p className="text-paper/60">لا توجد ملفات لهذه المعلمة.</p>
              ) : (
                files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => openFile(f)}
                    className="w-full text-right flex items-center gap-2 bg-paper/10 rounded-lg px-3 py-2 hover:bg-paper/20 transition-colors"
                  >
                    <span className="font-bold text-amber">
                      {(f.file_ext ?? "رابط").toUpperCase()}
                    </span>
                    <span className="truncate">{f.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {files.map((f) => (
            <FileCard key={f.id} file={f} onOpen={openFile} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThanksList } from "@/components/ThanksList";
import { VisionMission } from "@/components/VisionMission";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileCard, type FileRow } from "@/components/FileCard";
import { EXT_COLOR } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبتي — منصة مدرسة سبح المعاشي" },
      {
        name: "description",
        content: "كل مشاريعك وأوراق العمل في مكان واحد، خاصة بك وحدك، مع بحث وفلترة بالمادة والصف.",
      },
      { property: "og:title", content: "مكتبتي — منصة مدرسة سبح المعاشي" },
      {
        property: "og:description",
        content: "كل مشاريعك وأوراق العمل في مكان واحد، خاصة بك وحدك.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("files")
        .select("id,title,description,subject,category,grade,file_path,file_ext,file_size,video_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error("تعذّر تحميل الملفات.");
      setFiles((data as FileRow[]) ?? []);
      setFetching(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const subjects = useMemo(
    () => Array.from(new Set(files.map((f) => f.subject).filter(Boolean))),
    [files],
  );
  const grades = useMemo(
    () => Array.from(new Set(files.map((f) => f.grade).filter(Boolean))),
    [files],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of files) {
      const key = (f.file_ext ?? "link").toLowerCase();
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [files]);

  const visible = files.filter((f) => {
    const q = query.trim();
    const matchQ =
      !q || f.title.includes(q) || f.description.includes(q) || f.subject.includes(q);
    return matchQ && (!subject || f.subject === subject) && (!grade || f.grade === grade);
  });

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

  async function removeFile(file: FileRow) {
    if (!window.confirm(`حذف «${file.title}» نهائيًا؟`)) return;
    if (file.file_path) {
      await supabase.storage.from("teacher-files").remove([file.file_path]);
    }
    const { error } = await supabase.from("files").delete().eq("id", file.id);
    if (error) {
      toast.error("تعذّر الحذف.");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    toast.success("تم الحذف.");
  }

  const chip = "px-3 py-1.5 rounded-full bg-card border border-border font-semibold text-xs";
  const chipOn = "px-3 py-1.5 rounded-full bg-ink text-paper border border-border font-semibold text-xs";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <VisionMission />
      {user ? <ThanksList teacherId={user.id} /> : null}
      <section className="mx-auto max-w-[1200px] px-5 py-9">
        <div className="flex flex-wrap items-end gap-4 mb-7 rise">
          <h1 className="font-display font-black text-4xl tracking-tight">مكتبتي</h1>
          <span className="text-muted-foreground pb-1.5">
            {files.length} ملفًا · خاص بكِ فقط
          </span>
          <span className="mr-auto text-[11px] bg-teal/15 text-teal border border-teal/40 rounded-full px-2.5 py-1 font-semibold">
            لا ترى معلماتك ملفاتك
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-60 shrink-0 space-y-6">
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-2">
              <span className="text-muted-foreground">⌕</span>
              <input
                className="bg-transparent outline-none w-full text-sm"
                placeholder="ابحث في ملفاتك"
                value={query}
                maxLength={100}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground mb-2.5">
                المادة
              </p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">لا توجد مواد بعد</span>
                ) : null}
                {subjects.map((s) => (
                  <button
                    key={s}
                    className={subject === s ? chipOn : chip}
                    onClick={() => setSubject(subject === s ? null : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground mb-2.5">
                الصف
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grades.length === 0 ? (
                  <span className="text-xs text-muted-foreground">لا توجد صفوف بعد</span>
                ) : null}
                {grades.map((g) => (
                  <button
                    key={g}
                    className={grade === g ? chipOn : chip}
                    onClick={() => setGrade(grade === g ? null : g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-foreground/10">
              <p className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground mb-2.5">
                أنواع الملفات
              </p>
              <div className="space-y-1.5 text-xs font-semibold">
                {Object.entries(counts).map(([ext, n]) => (
                  <div key={ext} className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-[3px] ${EXT_COLOR[ext] ?? "bg-ink"}`}
                    />
                    {ext.toUpperCase()}
                    <span className="mr-auto text-muted-foreground">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {fetching ? (
              <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
            ) : visible.length === 0 ? (
              <div className="card-ink pop-teal p-8 text-center">
                <p className="font-display font-bold text-xl mb-2">لا توجد ملفات بعد</p>
                <p className="text-sm text-muted-foreground mb-4">
                  ابدئي برفع أول ورقة عمل أو مشروع.
                </p>
                <Link
                  to="/upload"
                  className="inline-block bg-ink text-paper rounded-full px-6 py-3 font-bold border border-border pop-amber"
                >
                  ارفعي ملفًا
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {visible.map((f) => (
                  <FileCard key={f.id} file={f} onOpen={openFile} onDelete={removeFile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

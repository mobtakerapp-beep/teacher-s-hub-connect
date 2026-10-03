import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ALLOWED_EXTENSIONS,
  CATEGORIES,
  GRADES,
  MAX_FILE_BYTES,
  SUBJECTS,
  categoryEmoji,
  formatSize,
} from "@/lib/constants";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "رفع ملف — منصة مدرسة سبح المعاشي" },
      {
        name: "description",
        content: "ارفعي أوراق العمل والمشاريع بصيغ PDF وDOCX وPPTX والصور حتى ١٥ ميجابايت.",
      },
      { property: "og:title", content: "رفع ملف — منصة مدرسة سبح المعاشي" },
      {
        property: "og:description",
        content: "ارفعي أوراق العمل والمشاريع بصيغ PDF وDOCX وPPTX والصور حتى ١٥ ميجابايت.",
      },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  function pick(next: File | null) {
    setFileError("");
    if (!next) {
      setFile(null);
      return;
    }
    const ext = next.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      setFileError(`الصيغة «${ext || "غير معروفة"}» غير مسموحة. المسموح: PDF، DOCX، PPTX، PNG، JPG.`);
      setFile(null);
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setFileError(`الملف «${next.name}» تجاوز الحد (${formatSize(next.size)} من أصل ١٥ م.ب).`);
      setFile(null);
      return;
    }
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !user) return;
    if (!title.trim()) {
      toast.error("اكتبي اسم الملف المعروض.");
      return;
    }
    if (!file && !videoUrl.trim()) {
      toast.error("اختاري ملفًا أو أضيفي رابط فيديو.");
      return;
    }
    if (videoUrl.trim() && !/^https:\/\/\S+$/.test(videoUrl.trim())) {
      toast.error("الرابط يجب أن يبدأ بـ https://");
      return;
    }

    setBusy(true);
    try {
      let filePath: string | null = null;
      let fileExt: string | null = null;

      if (file) {
        fileExt = file.name.split(".").pop()!.toLowerCase();
        filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const { error } = await supabase.storage
          .from("teacher-files")
          .upload(filePath, file, file.type ? { contentType: file.type } : undefined);
        if (error) throw error;
      }

      const { error } = await supabase.from("files").insert({
        user_id: user.id,
        title: title.trim().slice(0, 150),
        description: description.trim().slice(0, 500),
        subject,
        category,
        grade,
        file_path: filePath,
        file_ext: fileExt,
        file_size: file?.size ?? null,
        video_url: videoUrl.trim() || null,
      });
      if (error) throw error;

      toast.success("تم رفع الملف بنجاح.");
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الرفع.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full bg-card border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="bg-amber/10 border-b-2 border-foreground/15 min-h-[calc(100vh-4rem)]">
        <form
          onSubmit={submit}
          className="mx-auto max-w-[1200px] px-5 py-9 grid lg:grid-cols-[1fr_320px] gap-8"
        >
          <div>
            <h1 className="font-display font-black text-3xl tracking-tight mb-5 rise">ارفعي ملفك</h1>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed border-ink rounded-2xl p-10 text-center cursor-pointer transition-colors duration-200 ${
                dragging ? "bg-amber/25" : "bg-card/70 hover:bg-card"
              }`}
            >
              <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-amber border border-border text-2xl font-black mb-3">
                ↓
              </span>
              <p className="font-display font-bold text-xl">
                {file ? file.name : "اسحبي الملفات هنا أو اختاريها من جهازك"}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                PDF · DOCX · PPTX · PNG · JPG — حتى ١٥ م.ب للملف الواحد
              </p>
              {file ? (
                <p className="text-xs font-bold text-teal mt-2">جاهز للرفع · {formatSize(file.size)}</p>
              ) : null}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold">اسم الملف المعروض</label>
              <input
                className={inputClass}
                value={title}
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ورقة عمل الكسور — الوحدة ٣"
              />

              <label className="block text-xs font-bold">وصف مختصر</label>
              <input
                className={inputClass}
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تمارين متدرجة مع مفتاح الإجابة"
              />

              <label className="block text-xs font-bold">التصنيف</label>
              <select
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{`${categoryEmoji(c)} ${c}`}</option>
                ))}
              </select>

              <label className="block text-xs font-bold">المادة والصف</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  className={inputClass}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <select className={inputClass} value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {GRADES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <label className="block text-xs font-bold">
                رابط فيديو بديل{" "}
                <span className="text-muted-foreground font-normal">
                  (يوتيوب / درايف — يوفّر المساحة)
                </span>
              </label>
              <input
                className={inputClass}
                value={videoUrl}
                maxLength={500}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-bold text-coral">{fileError ? `⚠ ${fileError}` : ""}</span>
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-ink text-paper rounded-full px-6 py-3 font-bold border border-border pop-amber transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {busy ? "جارٍ الرفع…" : "ارفعي الآن"}
                </button>
              </div>
            </div>
          </div>

          <aside className="card-ink pop-teal p-5 h-fit">
            <p className="font-display font-black text-lg mb-3">تعليمات الرفع</p>
            <ul className="space-y-2.5 text-xs text-pretty leading-relaxed">
              <li className="flex gap-2">
                <span className="text-teal font-black">✓</span>الحد الأقصى ١٥ م.ب للملف الواحد.
              </li>
              <li className="flex gap-2">
                <span className="text-teal font-black">✓</span>الصيغ المسموحة: PDF، DOCX، PPTX، PNG، JPG.
              </li>
              <li className="flex gap-2">
                <span className="text-teal font-black">✓</span>فضّلي صيغة PDF لثبات التنسيق.
              </li>
              <li className="flex gap-2">
                <span className="text-teal font-black">✓</span>للفيديو أضيفي رابطًا بدل الرفع.
              </li>
            </ul>
            <p className="mt-4 pt-3 border-t-2 border-foreground/10 text-[11px] text-muted-foreground">
              ملفاتك خاصة بمكتبك فقط.
            </p>
          </aside>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

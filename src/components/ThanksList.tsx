import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Thank = { id: string; message: string; created_at: string };

export function ThanksList({ teacherId }: { teacherId: string }) {
  const [items, setItems] = useState<Thank[]>([]);

  useEffect(() => {
    let active = true;
    void supabase
      .from("thanks")
      .select("id,message,created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setItems((data as Thank[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [teacherId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1200px] px-5 pt-6">
      <div className="card-ink p-5 border-accent/40">
        <p className="font-display font-black text-lg mb-3">رسائل شكر من مديرة المدرسة 🌷</p>
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.id} className="bg-accent/10 rounded-lg px-4 py-3 text-sm leading-relaxed">
              {t.message}
              <span className="block text-[11px] text-muted-foreground mt-1">
                {new Date(t.created_at).toLocaleDateString("ar")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

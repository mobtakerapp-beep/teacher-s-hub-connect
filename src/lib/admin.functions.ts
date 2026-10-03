import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const claimAdminCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ code: z.string().trim().min(1).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    const expected = process.env["ADMIN_ACCESS_CODE"];
    if (!expected) {
      throw new Error("لم يتم ضبط كود المدير بعد.");
    }
    if (data.code !== expected) {
      return { ok: false as const, message: "الكود غير صحيح." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: context.userId, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    if (error) {
      console.error("claimAdminCode failed", error);
      throw new Error("تعذّر تفعيل صلاحية المدير.");
    }

    return { ok: true as const, message: "تم تفعيل صلاحية المدير." };
  });

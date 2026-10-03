import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeUsername, usernameToAuthEmail } from "@/lib/usernameAuth";

export const createUsernameAccount = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        username: z.string().trim().min(2).max(40),
        password: z.string().min(6).max(72),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = normalizeUsername(data.username);
    const email = usernameToAuthEmail(username);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username, full_name: data.username.trim() },
    });

    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        throw new Error("اسم المستخدم مستخدم بالفعل.");
      }
      console.error("createUsernameAccount failed", error);
      throw new Error("تعذّر إنشاء الحساب.");
    }

    if (!created.user) {
      throw new Error("تعذّر إنشاء الحساب.");
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: created.user.id, full_name: data.username.trim() },
        { onConflict: "id" },
      );

    if (profileError) {
      console.error("createUsernameAccount profile failed", profileError);
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: created.user.id, role: "teacher" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    if (roleError) {
      console.error("createUsernameAccount role failed", roleError);
    }

    return { ok: true as const };
  });

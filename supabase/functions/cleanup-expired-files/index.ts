import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const expectedToken = `Bearer ${Deno.env.get("CRON_SECRET")}`;

    if (authHeader !== expectedToken) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    const { data: expiredFiles, error: fetchError } = await supabase
      .from("files")
      .select("id, storage_path")
      .eq("is_deleted", false)
      .lte("expires_at", now);

    if (fetchError) {
      return new Response(
        JSON.stringify({ ok: false, error: fetchError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, deleted: 0, message: "No expired files found." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const paths = expiredFiles.map((f) => f.storage_path);

    const { error: storageError } = await supabase.storage
      .from("arithvoid-files")
      .remove(paths);

    if (storageError) {
      return new Response(
        JSON.stringify({ ok: false, error: storageError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ids = expiredFiles.map((f) => f.id);

    const { error: updateError } = await supabase
      .from("files")
      .update({
        is_deleted: true,
        deleted_at: now,
      })
      .in("id", ids);

    if (updateError) {
      return new Response(
        JSON.stringify({ ok: false, error: updateError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, deleted: ids.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
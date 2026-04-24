import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "roadmap@100xengineers.com";

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function renderEmailHtml(body: string, name: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p>Hi ${name},</p>
${escaped}
<p style="margin-top:32px;color:#888;font-size:12px">100x Engineers · <a href="https://100xengineers.com">100xengineers.com</a></p>
</body></html>`;
}

Deno.serve(async (req) => {
  // Only allow internal calls (pg_cron via service key) or POST
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const db = serviceClient();

  // Fetch due reminders
  const { data: due, error } = await db
    .from("reminders")
    .select(`
      id,
      reminder_type,
      roadmap_id,
      roadmaps ( roadmap_json ),
      users ( email, display_name )
    `)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return Response.json({ sent: 0 });

  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    try {
      const roadmapJson = (reminder.roadmaps as { roadmap_json: Record<string, unknown> })?.roadmap_json;
      const user = reminder.users as { email: string; display_name: string };
      if (!roadmapJson || !user) throw new Error("Missing roadmap or user data");

      const emailContent = (roadmapJson.reminder_emails as Record<string, { subject: string; body: string }>)[reminder.reminder_type];
      if (!emailContent) throw new Error(`No email content for ${reminder.reminder_type}`);

      const subject = emailContent.subject.replace(/\{\{name\}\}/g, user.display_name);
      const html = renderEmailHtml(emailContent.body.replace(/\{\{name\}\}/g, user.display_name), user.display_name);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user.email,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${res.status} ${err}`);
      }

      await db.from("reminders").update({
        status: "sent",
        sent_at: new Date().toISOString(),
      }).eq("id", reminder.id);

      sent++;
    } catch (err) {
      await db.from("reminders").update({ status: "failed" }).eq("id", reminder.id);
      console.error(`Reminder ${reminder.id} failed:`, err);
      failed++;
    }
  }

  return Response.json({ sent, failed });
});

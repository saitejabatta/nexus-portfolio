import { getPortfolio } from "@/lib/data/repository";

export const runtime = "nodejs";

/**
 * POST /api/lead — a visitor wants to connect. Notifies the portfolio owner.
 *
 * - RESEND_API_KEY configured: sends a real email via Resend (free tier).
 * - Otherwise: persists to Supabase `events` if configured, else just logs
 *   server-side so nothing is silently lost during local dev.
 */
export async function POST(req: Request) {
  let body: { name?: string; email?: string; message?: string; query?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const name = String(body?.name ?? "").slice(0, 200).trim();
  const email = String(body?.email ?? "").slice(0, 200).trim();
  const message = String(body?.message ?? "").slice(0, 2000).trim();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Name and a valid email are required" }, { status: 400 });
  }

  const lead = { name, email, message, query: body?.query ?? "", ts: new Date().toISOString() };

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const ownerEmail = getPortfolio().profile.socials.email;
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "NEXUS <onboarding@resend.dev>",
        to: ownerEmail ? [ownerEmail] : [],
        replyTo: email,
        subject: `New NEXUS lead: ${name}`,
        text: `${name} (${email}) reached out via NEXUS.\n\nMessage: ${message || "(none)"}\n\nThey were asking: "${lead.query}"`,
      });
    } catch (err) {
      console.error("[lead] Resend send failed:", err);
      // fall through — still record the lead even if email fails
    }
  } else {
    console.log("[lead] (no RESEND_API_KEY configured) new lead:", lead);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key);
      await supabase.from("events").insert({ type: "lead_captured", payload: lead });
    } catch (err) {
      console.error("[lead] Supabase insert failed:", err);
    }
  }

  return Response.json({ status: "ok" });
}

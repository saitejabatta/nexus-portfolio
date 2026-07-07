/**
 * One-time setup: create the admin user for the /admin dashboard.
 * The user gets app_metadata.role = "admin", which the RLS policies
 * (supabase/migrations/0002_rls.sql, is_admin()) check on every write.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... \
 *   node scripts/create-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Missing one of NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (error) {
  console.error("Failed to create admin user:", error.message);
  process.exit(1);
}

console.log("Admin user created:", data.user.id, data.user.email);

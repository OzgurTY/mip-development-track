import { createClient } from "@supabase/supabase-js";

// Seeds (or re-seeds) the admin user against the linked Supabase project.
// Run with: pnpm exec tsx --env-file=.env.local scripts/seed-admin.ts
async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const email = "admin@mip.local";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "Passw0rd!",
    email_confirm: true,
    user_metadata: { full_name: "MIP Admin" },
  });

  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }

  let userId = data?.user?.id;
  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
  }

  if (!userId) {
    throw new Error("admin user not found after seeding");
  }

  await admin.from("profiles").update({ role: "admin" }).eq("id", userId);
  console.log("seeded admin@mip.local as admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

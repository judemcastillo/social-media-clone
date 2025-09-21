// scripts/backfill-avatars.js
import prisma from "../src/lib/prisma.js";
import crypto from "node:crypto";

const USE_GRAVATAR = process.env.USE_GRAVATAR === "true";

// Deterministic, privacy-friendly avatar (no email exposure)
function dicebearUrl(seed) {
  // You can change "bottts" to "thumbs", "identicon", etc.
  return `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(seed)}&scale=80`;
}

// Gravatar identicon (reveals MD5 of email to gravatar.com)
function gravatarUrl(email) {
  const normalized = (email || "").trim().toLowerCase();
  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=256`;
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ image: null }, { image: "" }],
    },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("No users to backfill.");
    return;
  }

  // Batch updates (chunk to be kind to the DB)
  const CHUNK = 100;
  let updated = 0;

  for (let i = 0; i < users.length; i += CHUNK) {
    const slice = users.slice(i, i + CHUNK);

    await Promise.all(
      slice.map((u) =>
        prisma.user.update({
          where: { id: u.id },
          data: {
            image: USE_GRAVATAR ? gravatarUrl(u.email) : dicebearUrl(u.id),
          },
        })
      )
    );

    updated += slice.length;
    console.log(`Updated ${updated}/${users.length}`);
  }

  console.log(`Done. Updated ${updated} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Creates an administrator, or resets the password of an existing one.
 *
 *   npx tsx scripts/create-admin.ts <username> "<Display name>" [password]
 *
 * Without a password a strong random one is generated and printed once.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

async function main() {
  const [username, displayName = "Administrator", given] = process.argv.slice(2);
  if (!username || !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    console.error('İstifadə: npx tsx scripts/create-admin.ts <username> "<Ad Soyad>" [şifrə]');
    process.exit(1);
  }
  if (given && given.length < 8) {
    console.error("Şifrə ən azı 8 simvol olmalıdır.");
    process.exit(1);
  }
  const password = given || crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: "ADMIN", isActive: true },
    create: { username, displayName, passwordHash, role: "ADMIN", isActive: true },
  });

  console.log(`\n✓ Administrator hazırdır: ${user.username}`);
  if (!given) console.log(`  Şifrə: ${password}\n  (yadda saxlayın — bir daha göstərilməyəcək)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

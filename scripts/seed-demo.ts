/**
 * Demo data for local testing ONLY: users, flowers and a few orders.
 *
 *   npx tsx scripts/seed-demo.ts
 *
 * Passwords: DEMO_PASSWORD from the environment, otherwise a random one
 * (printed at the end). Refuses to run when NODE_ENV=production.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { normalizePhone } from "../src/lib/phone";

if (process.env.NODE_ENV === "production") {
  console.error("seed-demo production mühitində işə salına bilməz.");
  process.exit(1);
}

function dateOnly(offsetDays: number) {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays));
}

async function main() {
  const password = process.env.DEMO_PASSWORD || crypto.randomBytes(6).toString("base64url");
  if (password.length < 8 && process.env.DEMO_PASSWORD) {
    throw new Error("DEMO_PASSWORD ən azı 8 simvol olmalıdır");
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const users = [
    { username: "admin", displayName: "Administrator", role: "ADMIN" as const },
    { username: "operator1", displayName: "Operator Anna", role: "CALL_CENTER" as const },
    { username: "florist1", displayName: "Florist Elena", role: "FLORIST" as const },
    { username: "florist2", displayName: "Florist Olqa", role: "FLORIST" as const },
  ];
  const byName: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, isActive: true },
      create: { ...u, passwordHash, isActive: true },
    });
    byName[u.username] = user.id;
  }

  const flowers = [
    { name: "Qızılgül (qırmızı)", unitType: "STEM" as const, stockQuantity: 120, lowStockLevel: 20 },
    { name: "Qızılgül (ağ)", unitType: "STEM" as const, stockQuantity: 80, lowStockLevel: 20 },
    { name: "Lalə", unitType: "STEM" as const, stockQuantity: 60, lowStockLevel: 15 },
    { name: "Xrizantema", unitType: "BUNCH" as const, stockQuantity: 12, lowStockLevel: 5 },
    { name: "Evkalipt", unitType: "BUNCH" as const, stockQuantity: 4, lowStockLevel: 5 },
  ];
  for (const f of flowers) {
    await prisma.flower.upsert({ where: { name: f.name }, update: {}, create: f });
  }

  const orders = [
    { customerFullName: "Ayşə Məmmədova", customerPhone: "050 123 45 67", day: 0, time: "14:00", type: "DELIVERY" as const,
      address: "Bakı, Nəsimi r., 28 May küç. 12", notes: "Çatdırmazdan əvvəl zəng edin", amount: 150 },
    { customerFullName: "Elvin Həsənov", customerPhone: "+994 55 234 56 78", day: 0, time: "16:00", type: "PICKUP" as const,
      address: null, notes: "Ağ və çəhrayı tonlarda", amount: 85.5 },
    { customerFullName: "Leyla İbrahimova", customerPhone: "070 345 67 89", day: 1, time: "10:00", type: "DELIVERY" as const,
      address: "Bakı, Yasamal r., Azadlıq pr. 45", notes: "Ad günü üçün, kart əlavə edin", amount: 200 },
  ];

  for (const o of orders) {
    const phone = normalizePhone(o.customerPhone);
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: {},
      create: { fullName: o.customerFullName, phone, address: o.address },
    });
    await prisma.order.create({
      data: {
        customerFullName: o.customerFullName,
        customerPhone: phone,
        customerId: customer.id,
        deliveryDate: dateOnly(o.day),
        deliveryTime: o.time,
        orderType: o.type,
        deliveryAddress: o.address,
        notes: o.notes,
        amount: o.amount,
        createdById: byName.operator1,
        events: { create: { userId: byName.operator1, type: "ORDER_CREATED", to: "NEW" } },
      },
    });
  }

  console.log("\n✓ Demo məlumatları yaradıldı.");
  console.log(`  İstifadəçilər: ${users.map((u) => u.username).join(", ")}`);
  console.log(`  Şifrə (hamısı üçün): ${password}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

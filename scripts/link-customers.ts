/**
 * One-time data fix for existing installations:
 *  - normalizes phone numbers on orders and customers (+994XXXXXXXXX)
 *  - creates a customer card for every phone number that has orders
 *  - links all orders to their customer
 *
 *   npx tsx scripts/link-customers.ts
 */
import { prisma } from "./db";
import { normalizePhone } from "../src/lib/phone";

async function main() {
  // 1) Customers: normalize phones (skip if it would collide with another card)
  const customers = await prisma.customer.findMany();
  for (const c of customers) {
    const phone = normalizePhone(c.phone);
    if (phone === c.phone) continue;
    const clash = await prisma.customer.findUnique({ where: { phone } });
    if (clash) {
      console.warn(`! ${c.fullName}: ${c.phone} -> ${phone} artıq başqa müştəridə var, dəyişilmədi`);
      continue;
    }
    await prisma.customer.update({ where: { id: c.id }, data: { phone } });
  }

  // 2) Orders: normalize phone, find or create customer, link
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, customerFullName: true, customerPhone: true, deliveryAddress: true, customerId: true },
  });
  let created = 0;
  let linked = 0;
  for (const o of orders) {
    const phone = normalizePhone(o.customerPhone);
    let customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { fullName: o.customerFullName, phone, address: o.deliveryAddress?.slice(0, 191) ?? null },
      });
      created++;
    }
    if (o.customerId !== customer.id || o.customerPhone !== phone) {
      await prisma.order.update({ where: { id: o.id }, data: { customerId: customer.id, customerPhone: phone } });
      linked++;
    }
  }
  console.log(`✓ Hazırdır: ${created} yeni müştəri kartı, ${linked} sifariş bağlandı.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

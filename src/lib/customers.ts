import { prisma } from "@/lib/prisma";

/**
 * Returns the customer with this (normalized) phone number, creating one if
 * needed. Existing customer details are never overwritten by an order.
 */
export async function findOrCreateCustomer(fullName: string, phone: string, address?: string | null) {
  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) return existing;
  try {
    return await prisma.customer.create({
      data: { fullName, phone, address: address ? address.slice(0, 191) : null },
    });
  } catch (e) {
    // Two orders for a new customer at the same moment: the other one won.
    const again = await prisma.customer.findUnique({ where: { phone } });
    if (again) return again;
    throw e;
  }
}

/** Digits of a search string, without a leading 0 / 994 (to match "+994..." numbers). */
export function phoneSearchFragment(search: string): string | null {
  let digits = search.replace(/\D/g, "");
  if (digits.length < 4) return null;
  if (digits.startsWith("994")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

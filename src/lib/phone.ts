/**
 * Normalizes phone numbers so that "050 123 45 67", "+994501234567" and
 * "0501234567" all map to the same customer: "+994501234567".
 * Numbers that do not look Azerbaijani are kept as digits (with "+" if given).
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  if (digits.startsWith("00")) digits = digits.slice(2);

  // Local Azerbaijani formats: 0XX XXX XX XX (10 digits) or XX XXX XX XX (9 digits)
  if (!hasPlus && digits.length === 10 && digits.startsWith("0")) return `+994${digits.slice(1)}`;
  if (!hasPlus && digits.length === 9) return `+994${digits}`;
  if (digits.startsWith("994") && digits.length === 12) return `+${digits}`;

  return hasPlus || digits.length > 10 ? `+${digits}` : digits;
}

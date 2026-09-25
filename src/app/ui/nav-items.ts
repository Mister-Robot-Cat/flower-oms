// One list for the desktop bar and the phone menu.
export type NavItem = { href: string; label: string };

export function navItems(role?: string): NavItem[] {
  const items: NavItem[] = [];
  if (role === "ADMIN" || role === "CALL_CENTER") items.push({ href: "/orders", label: "Sifarişlər" });
  if (role === "ADMIN" || role === "CALL_CENTER") items.push({ href: "/callcenter", label: "Zəng mərkəzi" });
  if (role === "FLORIST" || role === "ADMIN") items.push({ href: "/florist", label: "Florist" });
  if (role === "ADMIN" || role === "CALL_CENTER") items.push({ href: "/customers", label: "Müştərilər" });
  if (role === "ADMIN") {
    items.push(
      { href: "/admin/flowers", label: "Anbar" },
      { href: "/admin/reports/sales", label: "Satışlar" },
      { href: "/admin/reports/performance", label: "Performans" },
      { href: "/admin/users", label: "İşçilər" },
    );
  }
  return items;
}

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

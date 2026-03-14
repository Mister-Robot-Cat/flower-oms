"use client";

import { useState } from "react";
import Link from "next/link";

interface MobileMenuProps {
  role?: string;
  isAuthenticated: boolean;
}

export default function MobileMenu({ role, isAuthenticated }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[#F3F1F2] transition-colors"
        aria-label="Menu"
      >
        <span className={`block h-0.5 w-6 bg-[#501257] transition-transform ${isOpen ? "rotate-45 translate-y-2" : ""}`}></span>
        <span className={`block h-0.5 w-6 bg-[#501257] transition-opacity ${isOpen ? "opacity-0" : ""}`}></span>
        <span className={`block h-0.5 w-6 bg-[#501257] transition-transform ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[45] md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-72 sm:w-80 border-l border-[#C743DA]/30 shadow-2xl z-50 transform transition-transform duration-300 md:hidden bg-white/95 backdrop-blur-xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-4 gap-2 h-full overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={closeMenu}
            className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
          >
            🏠 Panel
          </Link>

          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link
              href="/orders"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
            >
              📦 Sifarişlər
            </Link>
          )}

          {role === "CALL_CENTER" && (
            <Link
              href="/callcenter"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
            >
              📞 Zəng mərkəzi
            </Link>
          )}

          {role === "FLORIST" && (
            <Link
              href="/florist"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
            >
              🌸 Florist paneli
            </Link>
          )}

          {(role === "ADMIN" || role === "CALL_CENTER") && (
            <Link
              href="/customers"
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
            >
              👥 Müştərilər
            </Link>
          )}

          {role === "ADMIN" && (
            <>
              <Link
                href="/admin/users"
                onClick={closeMenu}
                className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
              >
                👥 İstifadəçilər
              </Link>
              <Link
                href="/admin/flowers"
                onClick={closeMenu}
                className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
              >
                🏪 Anbar
              </Link>
              <Link
                href="/admin/reports/performance"
                onClick={closeMenu}
                className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
              >
                📊 Performans
              </Link>
              <Link
                href="/admin/reports/sales"
                onClick={closeMenu}
                className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
              >
                💰 Satışlar
              </Link>
            </>
          )}

          <Link
            href="/profile"
            onClick={closeMenu}
            className="px-4 py-3 rounded-xl text-[#501257] hover:bg-[#F3F1F2] hover:text-[#631974] transition-colors font-medium"
          >
            👤 Profil
          </Link>

          <div className="border-t border-[#C743DA]/30 my-2"></div>

          <Link
            href="/login"
            onClick={closeMenu}
            className="px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            🚪 Çıxış
          </Link>
        </nav>
      </div>
    </>
  );
}

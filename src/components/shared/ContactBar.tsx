import type { ThemeClasses } from "./theme";
import { Anim } from "./Anim";
import { WhatsAppIcon } from "./Icons";

interface ContactBarProps {
  t: ThemeClasses;
  compact?: boolean;
}

export function ContactBar({ t, compact = false }: ContactBarProps) {
  if (compact) {
    return (
      <Anim delay={0.25}>
        <div className={`${t.card} border rounded-2xl p-4 sm:p-6 backdrop-blur-xl max-w-6xl mx-auto`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <h4 className="text-base sm:text-lg font-semibold text-[#1da1aa]" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Prefieres hablar ahora?
            </h4>
            <div className="flex w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
              <a href="tel:+16893082809" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Llamar
              </a>
              <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] px-4 sm:px-6 py-3 rounded-xl font-bold text-sm no-underline hover:bg-[#25D366]/10 transition-all">
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </Anim>
    );
  }

  return (
    <Anim delay={0.25}>
      <div className={`${t.card} border rounded-2xl p-5 sm:p-8 backdrop-blur-xl max-w-6xl mx-auto`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1d9fa9]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#E4EEF0" }}>
                ¿Prefieres hablar directamente?
              </h4>
              <p className="text-xs sm:text-sm mt-1" style={{ color: "#6A8E98" }}>
                Llámanos o escríbenos por WhatsApp. Lunes a viernes, 10:00 A.M. a 5:00 P.M.
              </p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
            <a href="tel:+16893082809" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Llamar
            </a>
            <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] px-4 sm:px-6 py-3 rounded-xl font-bold text-sm no-underline hover:bg-[#25D366]/10 transition-all">
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Anim>
  );
}

import { Link } from "react-router-dom";
import type { ThemeClasses } from "./theme";
import { Anim } from "./Anim";
import { WhatsAppIcon } from "./Icons";

interface ContactBarProps {
  t: ThemeClasses;
}

export function ContactBar({ t }: ContactBarProps) {
  return (
    <Anim delay={0.25}>
      <div className={`mt-10 ${t.card} border rounded-2xl p-8 backdrop-blur-xl max-w-6xl mx-auto`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1d9fa9]/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <h4 className={`text-lg font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                ¿Prefieres hablar directamente?
              </h4>
              <p className={`text-sm ${t.textMuted} mt-1`}>
                Llámanos o escríbenos por WhatsApp. Lunes a viernes, 10:00 A.M. a 5:00 P.M.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a href="tel:+16893082809" className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all"> className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all"> className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Llamar ahora
            </a>
            <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] px-6 py-3 rounded-xl font-bold text-sm no-underline hover:bg-[#25D366]/10 transition-all">
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Anim>
  );
}

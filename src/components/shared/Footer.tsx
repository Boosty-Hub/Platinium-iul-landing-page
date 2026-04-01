import { Link } from "react-router-dom";
import { Phone, Instagram } from "lucide-react";
import type { ThemeClasses } from "./theme";
import { SERVICE_PAGES } from "./data";
import { WhatsAppIcon } from "./Icons";

interface FooterProps {
  t: ThemeClasses;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className={`${t.bg2} ${t.divider} border-t py-14 px-6`} role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="Platinium Insurance Group" className="h-9 w-auto" width={36} height={36} loading="lazy" />
              <div>
                <div className="text-[15px] font-bold text-[#1d9fa9]">PLATINIUM INSURANCE</div>
                <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase`}>GROUP</div>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Asesoría financiera especializada en la comunidad hispana de Miami. Protección, retiro y crecimiento financiero con transparencia.
            </p>
          </div>

          <nav aria-label="Servicios">
            <h4 className="text-[11px] tracking-[2px] text-white uppercase mb-4 font-bold">Servicios</h4>
            {SERVICE_PAGES.map((l) => (
              <Link key={l.href} to={l.href} className="block text-sm text-white/70 no-underline mb-2.5 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div>
            <h4 className="text-[11px] tracking-[2px] text-white uppercase mb-4 font-bold">🕒 Horarios de Atención</h4>
            <div className="text-sm text-white/70 leading-relaxed space-y-1">
              <p>Lunes a Viernes: 10:00 A.M. a 5:00 P.M.</p>
              <p>Sábado: Cerrado</p>
              <p>Domingo: Cerrado</p>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[2px] text-white uppercase mb-4 font-bold">Contacto</h4>
            <div className="text-sm text-white/70 space-y-3">
              <a href="tel:+16893082809" className="flex items-center gap-2.5 text-white/70 no-underline hover:text-white transition-colors">
                <Phone className="w-4 h-4 shrink-0 text-white" />
                (689) 308-2809
              </a>
              <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[#25D366] no-underline hover:opacity-80 transition-opacity">
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                +1 (786) 678-7863
              </a>
              <a href="https://www.instagram.com/platiniuminsurancegroup" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/70 no-underline hover:text-[#E4405F] transition-colors">
                <Instagram className="w-4 h-4 shrink-0 text-[#E4405F]" />
                @platiniuminsurancegroup
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] tracking-[2px] text-white uppercase mb-4 font-bold">📍 Oficinas</h4>
            <div className="text-sm text-white/70 space-y-3 leading-relaxed">
              <div>
                <p className="font-semibold text-white">Miami, FL (Central)</p>
                <p>5775 Waterford District Dr #170, Miami, FL 33126</p>
              </div>
              <div>
                <p className="font-semibold text-white">Orlando, FL</p>
                <p>13550 Village Park Dr, Orlando, FL 32837</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d9fa9]">Houston, TX</p>
                <p>16225 Park Ten Place, Of. 475, 4to Piso, Houston, TX 77084</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${t.divider} border-t pt-5 mt-10 flex flex-col sm:flex-row justify-between gap-3`}>
          <p className={`text-[11px] ${t.textMuted} opacity-60`}>© {new Date().getFullYear()} Platinium Insurance Group. Todos los derechos reservados.</p>
          <p className={`text-[10px] ${t.textMuted} opacity-50 max-w-lg`}>
            Descargo: Este sitio es informativo y no constituye asesoría financiera, legal o fiscal. El IUL es un producto de seguro, no una inversión regulada por la SEC. Consulte con un asesor licenciado.
          </p>
        </div>
      </div>
    </footer>
  );
}

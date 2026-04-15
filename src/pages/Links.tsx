import { MessageCircle, Phone, BarChart3, MapPin } from "lucide-react";

const links = [
  {
    label: "Chatear con un Asesor",
    href: "https://wa.me/17866787863",
    icon: MessageCircle,
    external: true,
  },
  {
    label: "Llamar AHORA!",
    href: "tel:+16893082809",
    icon: Phone,
    external: true,
  },
  {
    label: "Cotizar tu Proyección",
    href: "/contacto",
    icon: BarChart3,
    external: false,
  },
  {
    label: "Oficinas",
    href: "/contacto#oficinas",
    icon: MapPin,
    external: false,
  },
];

export default function Links() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(160deg, #0B1A1E 0%, #0a2328 40%, #07181c 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* Avatar / Logo */}
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg shadow-[#1d9fa9]/20 ring-2 ring-[#1d9fa9]/30">
          <img src="/logo.png" alt="Platinium Insurance Group" className="w-full h-full object-cover border-0 border-none rounded-none shadow-none" />
        </div>

        {/* Name & subtitle */}
        <div className="text-center">
          <h1
            className="text-xl font-semibold text-[#E4EEF0] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Platinium Insurance Group
          </h1>
          <p className="text-sm text-[#94B3BB] mt-1">
            Seguros de Vida IUL · Asesoría en Español
          </p>
        </div>

        {/* Social row */}
        <div className="flex gap-4">
          <a
            href="https://www.instagram.com/platiniuminsurance"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-[#1d9fa9]/30 flex items-center justify-center text-[#94B3BB] hover:text-[#1d9fa9] hover:border-[#1d9fa9]/60 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://wa.me/17866787863"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border border-[#1d9fa9]/30 flex items-center justify-center text-[#94B3BB] hover:text-[#1d9fa9] hover:border-[#1d9fa9]/60 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <a
            href="tel:+16893082809"
            className="w-10 h-10 rounded-full border border-[#1d9fa9]/30 flex items-center justify-center text-[#94B3BB] hover:text-[#1d9fa9] hover:border-[#1d9fa9]/60 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>

        {/* Link buttons */}
        <div className="w-full flex flex-col gap-3 mt-2">
          {links.map((link) => {
            const Icon = link.icon;
            const props = link.external
              ? { target: "_blank" as const, rel: "noopener noreferrer" }
              : {};
            return (
              <a
                key={link.label}
                href={link.href}
                {...props}
                className="group flex items-center gap-3 w-full px-5 py-4 rounded-2xl border border-[#1d9fa9]/20 bg-[#0F2229]/60 backdrop-blur-sm text-[#E4EEF0] hover:border-[#1d9fa9]/50 hover:bg-[#1d9fa9]/10 transition-all duration-200"
              >
                <Icon className="w-5 h-5 text-[#1d9fa9] flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{link.label}</span>
                <svg className="w-4 h-4 text-[#6A8E98] group-hover:text-[#1d9fa9] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-xs text-[#6A8E98] mt-4">
          © {new Date().getFullYear()} Platinium Insurance Group
        </p>
      </div>
    </div>
  );
}

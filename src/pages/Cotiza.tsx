import { Helmet } from "react-helmet-async";
import { LeadForm } from "@/components/shared/LeadForm";
import { getThemeClasses } from "@/components/shared/theme";
import { Anim } from "@/components/shared/Anim";
import aetna from "@/assets/logos/aetna.svg";
import ameritas from "@/assets/logos/ameritas.svg";
import fidelity from "@/assets/logos/fidelity.svg";
import americanamicable from "@/assets/logos/americanamicable.svg";
import floridablue from "@/assets/logos/floridablue.svg";
import unitedhealthcare from "@/assets/logos/unitedhealthcare.svg";

const PARTNER_LOGOS = [aetna, ameritas, fidelity, americanamicable, floridablue, unitedhealthcare];

export default function Cotiza() {
  const t = getThemeClasses(false);

  return (
    <div className="min-h-screen bg-white text-[#0B1A1E]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <html lang="es" />
        <title>Cotiza tu IUL Gratis | Platinum Insurance USA</title>
        <meta name="description" content="Recibe tu presupuesto personalizado de seguro IUL en español. Sin examen médico, aceptamos ITIN. Asesoría 100% gratis." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Cotiza tu IUL Gratis con Platinum Insurance" />
        <meta property="og:description" content="Protege a tu familia y haz crecer tu dinero con un seguro IUL. Asesoría gratis en español." />
        <meta property="og:image" content="https://platiniuminsuranceusa.com/og-image.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      {/* TOP BAR mínima */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Platinum Insurance Group" className="h-9 w-auto object-contain" width={36} height={36} />
            <span className="hidden sm:inline font-bold text-[#0B1A1E]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Platinum Insurance
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Licenciados en USA · Atención en Español
          </div>
        </div>
      </header>

      {/* HERO + FORM */}
      <section className="relative px-4 sm:px-6 py-6 sm:py-10 bg-gradient-to-b from-[#1d9fa9]/5 to-white">
        <div className="max-w-2xl mx-auto">
          <Anim>
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1d9fa9]/10 text-[#1d9fa9] text-xs font-semibold mb-4">
                ⭐ +1,000 familias protegidas
              </div>
              <h1
                className="text-2xl sm:text-4xl font-normal leading-[1.15] mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Cotiza tu{" "}
                <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                  IUL Gratis
                </span>{" "}
                con Platinum Insurance
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
                Protege a tu familia y haz crecer tu dinero con un Seguro de Vida Indexado. Sin compromisos, sin letras pequeñas.
              </p>
            </div>
          </Anim>

          <Anim delay={0.1}>
            <div id="form">
              <LeadForm t={t} dark={false} defaultInteres="Ahorro a largo plazo / retiro" inline />
            </div>
          </Anim>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-8 px-4 sm:px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-5">
            Trabajamos con las mejores aseguradoras de USA
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80">
            {PARTNER_LOGOS.map((logo, i) => (
              <img key={i} src={logo} alt="Aseguradora partner" className="h-8 sm:h-10 w-auto object-contain grayscale hover:grayscale-0 transition" loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIO */}
      <section className="py-10 px-4 sm:px-6 bg-[#1d9fa9]/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-yellow-400 text-lg mb-2">★★★★★</div>
          <p className="text-base sm:text-lg italic text-gray-700 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            "Me explicaron todo en español y sin complicaciones. Hoy mi familia tiene la protección que siempre quise darles."
          </p>
          <p className="text-sm font-semibold text-[#1d9fa9]">María G., cliente de Platinium</p>
        </div>
      </section>

      {/* FOOTER MINIMAL */}
      <footer className="py-6 px-4 sm:px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>© {new Date().getFullYear()} Platinum Insurance Group. Todos los derechos reservados.</div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/16893082809"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1d9fa9] font-semibold hover:underline"
            >
              💬 WhatsApp
            </a>
            <a href="/politica-de-privacidad" className="hover:underline">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

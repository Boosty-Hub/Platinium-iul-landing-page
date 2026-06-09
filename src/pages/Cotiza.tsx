import { Helmet } from "react-helmet-async";
import { LeadForm } from "@/components/shared/LeadForm";
import { getThemeClasses } from "@/components/shared/theme";

export default function Cotiza() {
  const t = getThemeClasses(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Helmet>
        <html lang="es" />
        <title>Cotiza tu IUL Gratis | Platinum Insurance USA</title>
        <meta name="description" content="Recibe tu presupuesto personalizado de seguro IUL en español. Sin examen médico, aceptamos ITIN. Asesoría 100% gratis." />
        <meta name="robots" content="index, follow" />
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

      <div className="w-full max-w-xl">
        <LeadForm t={t} dark={false} defaultInteres="Ahorro a largo plazo / retiro" inline />
      </div>
    </div>
  );
}

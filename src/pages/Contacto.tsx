import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Anim } from "@/components/shared/Anim";

export default function Contacto() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Agenda tu Consulta Gratuita | Platinium Insurance Group"
            description="Agenda una consulta gratuita sobre seguros IUL. Asesoría en español, sin compromiso. Miami, FL. Aceptamos ITIN."
            keywords="consulta IUL gratis, asesor IUL Miami, contacto Platinium Insurance, cotización IUL, agente seguros hispano Miami"
            canonical={`${DOMAIN}/contacto`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Contacto", item: `${DOMAIN}/contacto` },
                ],
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Contacto" }]} t={t} />

          <section className="pt-8 pb-8 px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-4 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Agenda tu{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    Consulta Gratuita
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-xl mx-auto leading-relaxed`}>
                  Completa el formulario y un asesor licenciado te contactará en español para revisar tu situación y mostrarte opciones reales.
                </p>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" />


          {/* MAP & OFFICES */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Nuestras <span className="italic text-[#1d9fa9]">oficinas</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { city: "Miami, FL (Central)", address: "5775 Waterford District Dr #170, Miami, FL 33126" },
                  { city: "Orlando, FL", address: "13550 Village Park Dr, Orlando, FL 32837" },
                  { city: "Houston, TX", address: "16225 Park Ten Place, Of. 475, 4to Piso, Houston, TX 77084" },
                ].map((office, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-6 text-center backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">📍</span>
                      <h3 className="text-lg font-semibold text-[#1d9fa9] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{office.city}</h3>
                      <p className={`text-sm ${t.textMuted}`}>{office.address}</p>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim delay={0.3}>
                <div className={`mt-8 p-5 ${t.brandBg} border border-[#1d9fa9]/15 rounded-xl text-center`}>
                  <p className={`text-sm ${t.textMid}`}>
                    🕒 <strong className={t.text}>Horario de atención:</strong> Lunes a Viernes, 10:00 A.M. a 5:00 P.M.
                  </p>
                </div>
              </Anim>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}

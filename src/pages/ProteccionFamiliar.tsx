import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Link } from "react-router-dom";

export default function ProteccionFamiliar() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro de Vida para Familias Hispanas | Protección IUL Miami"
            description="¿Quién cuidará a tu familia si no estás? El IUL cubre a tu familia y genera ahorros para el futuro. En español, sin complicaciones. Cotiza hoy en Miami."
            keywords="mejor seguro de vida para hispanos, seguro de vida familiar Miami, protección familiar hispanos Florida, seguro de vida para mis hijos, qué pasa con mi familia si me muero sin seguro, cómo dejar dinero a mis hijos cuando muera, seguro de vida para madre soltera hispana, cómo proteger a mi familia siendo inmigrante, seguro de vida para esposa e hijos en Miami, quién paga la hipoteca si me muero, dejar dinero a mis hijos sin impuestos"
            canonical={`${DOMAIN}/proteccion-familiar`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "Protección Familiar", item: `${DOMAIN}/proteccion-familiar` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "Protección Familiar con IUL",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Seguro de vida IUL para protección familiar hispana en Miami. Beneficio por fallecimiento, riders de enfermedades graves y valor en efectivo.",
                areaServed: { "@type": "State", name: "Florida" },
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "Protección Familiar" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">🏠 Protección Familiar</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Protege a tu familia en Miami{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    si algo te pasa
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  ¿Quién paga la renta? ¿Quién cubre la hipoteca? ¿Quién mantiene a tus hijos? El IUL asegura que tu familia en Miami, Hialeah o Doral esté protegida <strong className="text-[#1d9fa9]">pase lo que pase</strong>.
                </p>
              </Anim>
            </div>
          </section>

          {/* ESCENARIO SIN PROTECCIÓN */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  La realidad <span className="italic text-red-500">sin protección</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: "🏦", text: "Tu familia tendría que pagar la hipoteca o mudarse de la casa" },
                  { icon: "💔", text: "Gastos funerarios promedio en Miami: $8,000 – $15,000" },
                  { icon: "👨‍👩‍👧‍👦", text: "Tus hijos dependen de tu ingreso para comida, escuela y actividades" },
                  { icon: "📉", text: "Sin plan, tu familia recurre a GoFundMe o préstamos con intereses altos" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-5 flex items-start gap-4 backdrop-blur-xl`}>
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* BENEFICIOS DEL IUL PARA FAMILIAS */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cómo el IUL <span className="italic text-[#1d9fa9]">protege a tu familia</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Beneficio por Fallecimiento", desc: "Desde $250,000+ libres de impuestos para tus beneficiarios. Cubre hipoteca, deudas, educación y nivel de vida de tu familia en South Florida.", icon: "🛡️" },
                  { title: "Riders de Enfermedades Graves", desc: "Si te diagnostican cáncer, infarto u otra enfermedad crítica, puedes adelantar parte del beneficio para cubrir tratamiento y gastos.", icon: "❤️" },
                  { title: "Cobertura de Hipoteca", desc: "El beneficio por fallecimiento puede cubrir el saldo de tu hipoteca. Tu familia se queda en la casa, libre de deudas.", icon: "🏡" },
                  { title: "Valor en Efectivo", desc: "Mientras proteges a tu familia, acumulas ahorro que crece con el tiempo. Accesible mediante préstamos sin penalidades.", icon: "💰" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* PERFILES DE FAMILIAS */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Te identificas con alguna de estas <span className="italic text-[#1d9fa9]">situaciones</span>?
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  { profile: "Madre soltera en Hialeah", situation: "Eres el único ingreso. Si algo te pasa, tus hijos quedan sin sustento. El IUL les garantiza estabilidad financiera." },
                  { profile: "Padre con hipoteca nueva en Doral", situation: "Acabas de comprar casa. ¿Quién paga los $2,500/mes si no estás? El beneficio por fallecimiento cubre el saldo." },
                  { profile: "Familia que envía remesas", situation: "Tu familia en tu país depende de ti. El IUL asegura que sigan recibiendo apoyo económico." },
                  { profile: "Pareja joven con primer hijo en Miami", situation: "El momento perfecto para comenzar. Primas más bajas por tu edad, más años de crecimiento compuesto." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.profile}</h3>
                      <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.situation}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que incluye tu <span className="italic text-[#1d9fa9]">protección familiar</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  "Beneficio por fallecimiento desde $250,000 libre de impuestos",
                  "Riders para enfermedades crónicas, críticas y terminales",
                  "Cobertura permanente (no expira como un Term Life)",
                  "Valor en efectivo que crece indexado al S&P 500",
                  "Prima flexible que se adapta a tu presupuesto",
                  "Aplicable con ITIN — sin necesidad de SSN",
                  "Asesoría en español sin compromiso en Miami-Dade",
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.06}>
                    <div className="flex items-center gap-3">
                      <CheckIcon className="text-[#1d9fa9] shrink-0" />
                      <span className={`text-[15px] ${t.text}`}>{item}</span>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim delay={0.3}>
                <div className="mt-10 text-center flex flex-wrap justify-center gap-4">
                  <Link to="/beneficios-en-vida" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Beneficios en Vida →</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">¿Tienes ITIN? Aplica aquí →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" />
          <div className="px-6 pb-12"><ContactBar t={t} /></div>
        </>
      )}
    </Layout>
  );
}

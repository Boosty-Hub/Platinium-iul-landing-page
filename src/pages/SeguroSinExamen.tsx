import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Link } from "react-router-dom";

export default function SeguroSinExamen() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro de Vida Sin Examen Médico Miami | Para Hispanos | Platinium Insurance"
            description="¿Tienes condiciones preexistentes o no quieres examen? Hay opciones de seguro de vida sin sangre ni estudios médicos. Atención en español en Miami."
            keywords="seguro de vida sin examen médico, seguro de vida sin análisis de sangre, seguro de vida con preexistencias, seguro de vida sin hacerse examen, seguro de vida con diabetes hispanos, seguro de vida con presión alta, seguro de vida con condiciones preexistentes Miami, aseguranza de vida fácil de aprobar, seguro de vida aprobación garantizada, seguro de vida para personas mayores sin examen"
            canonical={`${DOMAIN}/seguro-vida-sin-examen-medico`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "Sin Examen Médico", item: `${DOMAIN}/seguro-vida-sin-examen-medico` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "Seguro de Vida sin Examen Médico",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Seguro de vida sin examen médico para hispanos en Miami. Aprobación rápida, sin análisis de sangre. Opciones para personas con condiciones preexistentes.",
                areaServed: { "@type": "State", name: "Florida" },
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "Sin Examen Médico" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">⚡ Aprobación Rápida</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Seguro de vida sin examen médico{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    en Miami
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  ¿No quieres hacerte exámenes de sangre? ¿Tienes condiciones preexistentes? Existen opciones de seguro de vida con <strong className="text-[#1d9fa9]">aprobación simplificada y rápida</strong> para hispanos en Miami-Dade.
                </p>
              </Anim>
            </div>
          </section>

          {/* PROCESO SIMPLIFICADO */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Proceso <span className="italic text-[#1d9fa9]">simplificado</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "📋", title: "Cuestionario Médico", desc: "En lugar de examen físico, respondes preguntas sobre tu salud. Sin agujas, sin laboratorio, sin citas médicas.", step: "01" },
                  { icon: "⚡", title: "Aprobación en 48-72hrs", desc: "El proceso tradicional toma 4-6 semanas. Sin examen, puedes estar aprobado en días, no semanas.", step: "02" },
                  { icon: "🛡️", title: "Cobertura Inmediata", desc: "Una vez aprobado, tu familia está protegida desde el día uno. Sin esperas innecesarias.", step: "03" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl text-center`}>
                      <span className="text-xs text-[#1d9fa9] font-bold tracking-[2px]">{item.step}</span>
                      <span className="text-3xl my-3 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* QUIÉN CALIFICA */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Quién <span className="italic text-[#1d9fa9]">califica</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: "✅", title: "Personas sanas que quieren rapidez", desc: "No quieres perder tiempo con citas médicas. Prefieres un proceso digital rápido." },
                  { icon: "✅", title: "Personas con diabetes tipo 2 controlada", desc: "Muchas aseguradoras aceptan diabetes controlada sin necesidad de examen adicional." },
                  { icon: "✅", title: "Personas con presión alta medicada", desc: "Si tu presión está controlada con medicamento, puedes calificar sin examen." },
                  { icon: "✅", title: "Personas mayores de 50 años", desc: "Opciones específicas para personas de 50-70 años que buscan cobertura sin complicaciones." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div>
                          <h3 className={`text-base font-semibold ${t.text} mb-1`}>{item.title}</h3>
                          <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* COMPARACIÓN */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Proceso tradicional vs <span className="italic text-[#1d9fa9]">sin examen</span>
                </h2>
              </Anim>
              <Anim delay={0.1}>
                <div className="overflow-x-auto">
                  <table className={`w-full ${t.divider} border rounded-xl overflow-hidden`}>
                    <thead>
                      <tr className={t.brandBg}>
                        <th className={`p-4 text-left text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Aspecto</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Tradicional</th>
                        <th className="p-4 text-center text-[11px] tracking-[2px] text-[#1d9fa9] uppercase font-bold">Sin Examen ✦</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { f: "Examen de sangre", trad: "Sí, obligatorio", noExam: "No requerido" },
                        { f: "Tiempo de aprobación", trad: "4-6 semanas", noExam: "48-72 horas" },
                        { f: "Cita médica", trad: "Sí, presencial", noExam: "No necesaria" },
                        { f: "Preguntas de salud", trad: "Extensas + examen", noExam: "Cuestionario simplificado" },
                        { f: "Cobertura máxima", trad: "Sin límite", noExam: "Hasta $1M+" },
                        { f: "Prima mensual", trad: "Generalmente menor", noExam: "Ligeramente mayor" },
                      ].map((row, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-4 text-sm ${t.text} font-medium`}>{row.f}</td>
                          <td className={`p-4 text-sm ${t.textMuted} text-center`}>{row.trad}</td>
                          <td className="p-4 text-sm text-[#1d9fa9] text-center font-semibold">{row.noExam}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Anim>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que ofrecemos en <span className="italic text-[#1d9fa9]">Platinium Insurance</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  "Opciones de aprobación sin examen de sangre ni orina",
                  "Proceso 100% en español con asesor personal en Miami",
                  "Cobertura desde $100,000 hasta $1,000,000+",
                  "Opciones para personas con diabetes, presión alta y otras condiciones",
                  "Aplicable con ITIN o SSN",
                  "Sin compromiso — cotización gratuita",
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
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← Protección Familiar</Link>
                  <Link to="/beneficios-en-vida" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Beneficios en Vida →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" />
          
        </>
      )}
    </Layout>
  );
}

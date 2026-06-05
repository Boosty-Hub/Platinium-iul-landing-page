import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Link } from "react-router-dom";

export default function BeneficiosEnVida() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Beneficios en Vida Seguro IUL | Enfermedad Crítica, Crónica y Terminal | Platinium Insurance"
            description="¿Sabías que puedes adelantar dinero de tu seguro si tienes cáncer u otra enfermedad grave? Conoce los beneficios en vida del IUL. En español, para hispanos en EE.UU."
            keywords="beneficios en vida seguro de vida, living benefits seguro de vida, seguro de vida con cobertura enfermedad crítica, qué pasa con mi seguro si me da cáncer, seguro de vida que paga por enfermedad, puedo usar mi seguro de vida si me enfermo, seguro de vida con cobertura de cáncer, beneficio por enfermedad terminal seguro de vida, seguro de vida que paga en vida"
            canonical={`${DOMAIN}/beneficios-en-vida`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "Beneficios en Vida", item: `${DOMAIN}/beneficios-en-vida` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "Beneficios en Vida del IUL",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Riders de beneficios en vida para enfermedades crónicas, críticas y terminales incluidos en pólizas IUL para hispanos en EE.UU.",
                areaServed: { "@type": "State", name: "Florida" },
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "Beneficios en Vida" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">❤️ Beneficios en Vida</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Usa tu seguro de vida{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      mientras vives
                    </span>
                    {" "}y no solo cuando mueras
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    La mayoría piensa que el seguro de vida solo sirve cuando falleces. Con el IUL, puedes <strong className="text-[#1d9fa9]">adelantar dinero de tu póliza</strong> si te diagnostican una enfermedad grave. Es protección real, cuando realmente la necesitas.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "🩺", text: "Enfermedad crónica: Alzheimer, Parkinson, artritis severa y más" },
                      { icon: "💔", text: "Enfermedad crítica: cáncer, infarto, derrame cerebral cubiertos" },
                      { icon: "🕊️", text: "Enfermedad terminal: accede a tu beneficio cuando más lo necesitas" },
                      { icon: "🌎", text: "Aplica con ITIN o SSN, disponible en todo EE.UU." },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${t.textMuted} italic`}>
                    Asesoría gratuita en español · Sin compromiso · Licenciados en USA
                  </p>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Protección por enfermedad" inline cardTitle="¡Accede a tus beneficios en vida! Cotiza GRATIS con Platinium" />
                </Anim>
              </div>
            </div>
          </section>

          {/* BANNER CTA */}
          <section className="px-6 pb-6">
            <ContactBar t={t} compact />
          </section>

          {/* TRES TIPOS DE RIDERS */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Tres tipos de <span className="italic text-[#1d9fa9]">protección en vida</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Enfermedad Crónica",
                    desc: "Si no puedes realizar 2 de 6 actividades diarias básicas (bañarte, vestirte, comer, etc.) por 90+ días, puedes adelantar un porcentaje de tu beneficio.",
                    examples: "Alzheimer, Parkinson, esclerosis múltiple, artritis severa",
                    icon: "🩺",
                  },
                  {
                    title: "Enfermedad Crítica",
                    desc: "Si te diagnostican una enfermedad crítica cubierta, recibes un adelanto del beneficio para cubrir tratamiento, gastos médicos y manutención.",
                    examples: "Cáncer, infarto, derrame cerebral, trasplante de órganos",
                    icon: "💔",
                  },
                  {
                    title: "Enfermedad Terminal",
                    desc: "Si tu expectativa de vida es de 12-24 meses, puedes acceder a la mayoría de tu beneficio por fallecimiento en vida.",
                    examples: "Cáncer terminal, insuficiencia orgánica, enfermedades degenerativas avanzadas",
                    icon: "🕊️",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 h-full backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMid} leading-relaxed mb-3`}>{item.desc}</p>
                      <p className={`text-xs ${t.textMuted} italic`}><strong>Ejemplos:</strong> {item.examples}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* CÓMO FUNCIONA */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Cómo <span className="italic text-[#1d9fa9]">funciona</span>?
                </h2>
              </Anim>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Te diagnostican una condición cubierta", desc: "Tu médico confirma una enfermedad crónica, crítica o terminal." },
                  { step: "02", title: "Solicitas el adelanto", desc: "Contactas a la aseguradora con la documentación médica. El proceso es confidencial." },
                  { step: "03", title: "Recibes el dinero", desc: "Se te adelanta un porcentaje del beneficio por fallecimiento (generalmente 50-90%) libre de impuestos." },
                  { step: "04", title: "Usas el dinero como quieras", desc: "Tratamiento médico, gastos del hogar, pago de deudas, sin restricciones de uso." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className="flex gap-5 items-start">
                      <div className="shrink-0 w-12 h-12 flex items-center justify-center border-2 border-[#1d9fa9] rounded-xl">
                        <span className="text-lg font-light text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>{item.step}</span>
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${t.text} mb-1`}>{item.title}</h3>
                        <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* POR QUÉ IMPORTA */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} mb-6`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Por qué esto importa para <span className="italic text-[#1d9fa9]">hispanos en EE.UU.</span>?
                </h2>
                <div className={`text-sm ${t.textMid} leading-relaxed space-y-4 text-left max-w-xl mx-auto`}>
                  <p>El cáncer es la segunda causa de muerte entre hispanos en EE.UU. La diabetes afecta a 1 de cada 5 hispanos. Y muchas familias inmigrantes no tienen seguro médico completo.</p>
                  <p>Sin los beneficios en vida, una enfermedad grave significa: <strong className={t.text}>deuda médica, pérdida de ingresos y una familia luchando por sobrevivir</strong>.</p>
                  <p>Con los riders del IUL, tienes un colchón financiero que se activa exactamente cuando más lo necesitas, <strong className="text-[#1d9fa9]">sin esperar a morir para que tu familia reciba ayuda</strong>.</p>
                </div>
              </Anim>
            </div>
          </section>

          {/* CHECKLIST */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que incluyen los <span className="italic text-[#1d9fa9]">beneficios en vida</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  "Adelanto del beneficio por enfermedad crónica (Chronic Illness Rider)",
                  "Adelanto del beneficio por enfermedad crítica (Critical Illness Rider)",
                  "Adelanto del beneficio por enfermedad terminal (Terminal Illness Rider)",
                  "Dinero libre de impuestos para usar como necesites",
                  "Sin restricciones de uso: tratamiento, deudas, gastos diarios",
                  "Riders generalmente incluidos sin costo adicional en la prima",
                  "Disponible en EE.UU. con ITIN o SSN",
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
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← Protección y Retiro</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Acceso con ITIN →</Link>
                  <Link to="/iul-para-hijos" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Plan para Hijos →</Link>
                  <Link to="/cotizacion-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Cotiza tu plan →</Link>
                </div>
              </Anim>
            </div>
          </section>

        </>
      )}
    </Layout>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";

const PAGE_FAQS = [
  { q: "¿Cuánto tarda en llegar el PDF con mi proyección?", a: "Normalmente en menos de 24-48 horas hábiles. Un asesor licenciado te contacta primero para validar algunos datos adicionales y luego prepara tu ilustración personalizada." },
  { q: "¿Es realmente gratis?", a: "Sí, completamente gratis y sin compromiso. La cotización y la consulta con el asesor no tienen costo. Si decides proceder, el asesor te explica el siguiente paso." },
  { q: "¿Me van a presionar para que contrate?", a: "No. El proceso es informativo. Recibes tu proyección, la revisas con calma y decides. No hay presión ni llamadas repetidas si no lo solicitas." },
  { q: "¿Puedo cotizar si tengo ITIN en lugar de SSN?", a: "Sí. El formulario acepta personas con SSN, ITIN o pasaporte. Indica tu tipo de identificación en el formulario y el asesor adapta el proceso." },
  { q: "¿Por qué no puedo ver los números al instante?", a: "Porque tu proyección depende de variables personales: edad, estado de salud, aportación mensual, plazo y meta de retiro. Sin esa información, cualquier número sería genérico y potencialmente engañoso. El PDF que recibes refleja tu situación real, no una estimación promedio." },
  { q: "¿Qué información necesito para completar el formulario?", a: "Datos básicos: tu nombre, edad aproximada, aportación mensual estimada, meta principal (protección, retiro, plan para hijos) y tipo de identificación. No necesitas documentos en esta etapa." },
];

export default function CotizacionIUL() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Cotización IUL Personalizada — Proyección en PDF | Platinium"
            description="Recibe tu proyección IUL en PDF: un asesor licenciado calcula tus números reales según tu edad, salud y aportación. Gratis, en español y sin compromiso."
            keywords="cotización IUL, cuánto cuesta un IUL, proyección IUL, ejemplo IUL, simulación IUL, precio IUL, cuánto puedo ahorrar con un IUL, ilustración IUL personalizada"
            canonical={`${DOMAIN}/cotizacion-iul`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Cotización IUL", item: `${DOMAIN}/cotizacion-iul` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "ContactPoint",
                contactType: "Asesoría de seguros",
                availableLanguage: "Spanish",
                areaServed: "US",
                hoursAvailable: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "18:00" },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Cotización IUL Personalizada" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="w-2 h-2 rounded-full bg-[#1d9fa9] animate-pulse" />
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">Proyección en PDF · Gratis · Sin compromiso</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Recibe tu proyección IUL{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      personalizada en PDF
                    </span>
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    No es una calculadora automática — es mejor: un asesor licenciado de Platinium analiza tu caso y te entrega una ilustración real con tus números, en español, sin costo y sin presión.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "📄", text: "Proyección en PDF con tus números reales — no estimaciones genéricas" },
                      { icon: "🗣️", text: "Llamada con asesor licenciado en español para revisar tu caso" },
                      { icon: "✅", text: "Sin compromiso — recibes la proyección y decides con calma" },
                      { icon: "🌎", text: "Aplica con SSN, ITIN o Pasaporte — sin Seguro Social" },
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
                  <LeadForm t={t} dark={dark} defaultInteres="Cotización / Proyección IUL" inline cardTitle="Recibe tu proyección IUL en PDF — gratis" />
                </Anim>
              </div>
            </div>
          </section>

          {/* BANNER CTA */}
          <section className="px-6 pb-6">
            <ContactBar t={t} compact />
          </section>

          {/* CÓMO FUNCIONA EL PROCESO */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  El proceso en <span className="italic text-[#1d9fa9]">3 pasos</span>
                </h2>
              </Anim>
              <div className="space-y-5">
                {[
                  { step: "01", title: "Completas el formulario (1 minuto)", desc: "Datos básicos: nombre, edad, aportación estimada, meta principal y tipo de identificación (SSN, ITIN o pasaporte). No necesitas documentos en esta etapa." },
                  { step: "02", title: "Te llama un asesor licenciado", desc: "En las próximas horas hábiles, un asesor de Platinium te contacta en español para validar tu información, aclarar dudas y confirmar los parámetros de tu proyección." },
                  { step: "03", title: "Recibes tu PDF personalizado", desc: "El asesor prepara tu ilustración con los números reales según tu caso y te la envía. Puedes revisarla con calma y hacer preguntas antes de decidir cualquier cosa." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl flex gap-5 items-start`}>
                      <div className="text-[#1d9fa9] font-bold text-2xl shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>{item.step}</div>
                      <div>
                        <h3 className={`text-base font-semibold ${t.text} mb-1`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                        <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* QUÉ RECIBIRÁS */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Qué recibirás con tu <span className="italic text-[#1d9fa9]">cotización</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "📄", title: "Proyección personalizada en PDF", desc: "Una ilustración generada por el asesor con tus números reales: cobertura estimada, valor en efectivo proyectado por año y prima mensual según tu perfil." },
                  { icon: "🗣️", title: "Llamada con asesor licenciado", desc: "Un asesor de Platinium te llama en español para resolver tus dudas, explicar el proceso de aplicación y confirmar que la propuesta se ajusta a tu meta." },
                  { icon: "✅", title: "Sin compromiso de contratación", desc: "Recibes la proyección, la revisas con calma y decides si quieres proceder. No hay contratos implícitos ni llamadas de seguimiento si no las solicitas." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl text-center`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* QUÉ INFORMACIÓN USAMOS */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Variables que afectan tu <span className="italic text-[#1d9fa9]">cotización</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  Por eso no puede ser instantánea: los números reales dependen de tu situación personal. Un número genérico no te sirve de nada — puede estar muy lejos de lo que realmente te costaría o acumularías.
                </p>
              </Anim>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "🎂", label: "Tu edad", desc: "A menor edad, más años de crecimiento y menor costo del seguro." },
                  { icon: "❤️", label: "Estado de salud", desc: "Determina el costo del seguro de vida dentro de la póliza." },
                  { icon: "💵", label: "Aportación mensual", desc: "Define cuánto va al seguro y cuánto al componente de ahorro." },
                  { icon: "🏁", label: "Meta y plazo", desc: "Retiro a los 60, educación de hijos, protección pura — cada meta cambia el diseño." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-5 text-center backdrop-blur-xl`}>
                      <span className="text-3xl mb-2 block">{item.icon}</span>
                      <div className={`font-semibold ${t.text} text-sm mb-1`}>{item.label}</div>
                      <p className={`text-xs ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* EJEMPLO ILUSTRATIVO */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ejemplo <span className="italic text-[#1d9fa9]">ilustrativo</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-xl mx-auto mb-8 text-[15px]`}>
                  Este es un caso ficticio para que visualices cómo se construye la proyección. Los números reales varían según tu perfil.
                </p>
              </Anim>
              <Anim delay={0.1}>
                <div className={`${t.card} border border-[#1d9fa9]/30 rounded-2xl p-8 backdrop-blur-xl`}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">👤</span>
                    <div>
                      <div className={`font-semibold ${t.text}`}>Carlos M. — 38 años, empleado 1099</div>
                      <div className={`text-sm ${t.textMuted}`}>Aportación: $300/mes · Meta: retiro a los 65 · ITIN</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Cobertura por fallecimiento", value: "~$400,000" },
                      { label: "Valor en efectivo estimado a los 65", value: "~$280,000" },
                      { label: "Acceso anual estimado en retiro", value: "~$18,000/año" },
                    ].map((item, i) => (
                      <div key={i} className={`text-center p-4 ${t.brandBg} rounded-xl border border-[#1d9fa9]/20`}>
                        <div className="text-[#1d9fa9] font-bold text-xl mb-1">{item.value}</div>
                        <div className={`text-xs ${t.textMuted}`}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[11px] ${t.textMuted} italic text-center`}>
                    Proyección ilustrativa basada en un escenario hipotético. No representa una garantía de rendimiento. Los resultados reales dependen del diseño de la póliza, la aseguradora, la salud del asegurado y el rendimiento del índice. Solicita tu proyección personalizada para conocer tus números reales.
                  </p>
                </div>
              </Anim>
            </div>
          </section>

          {/* ENLACES INFORMATIVOS */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-xl font-normal ${t.text} mb-6`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Quieres entender el producto antes de cotizar?
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/seguro-de-vida-iul" className={`${t.card} border rounded-lg px-5 py-3 text-sm font-semibold text-[#1d9fa9] no-underline hover:border-[#1d9fa9]/50 transition-all`}>
                    ¿Qué es un IUL? →
                  </Link>
                  <Link to="/seguro-vida-itin" className={`${t.card} border rounded-lg px-5 py-3 text-sm font-semibold text-[#1d9fa9] no-underline hover:border-[#1d9fa9]/50 transition-all`}>
                    ¿Aplica con ITIN o Pasaporte? →
                  </Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre <span className="italic text-[#1d9fa9]">la cotización</span>
                </h2>
              </Anim>
              <div className="space-y-3">
                {PAGE_FAQS.map((faq, i) => (
                  <Anim key={i} delay={i * 0.05}>
                    <div className={`${t.card} border rounded-xl overflow-hidden backdrop-blur-xl`}>
                      <button
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                        className={`w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer bg-transparent border-none ${t.text}`}
                        aria-expanded={faqOpen === i}
                      >
                        <span className="text-[15px] font-semibold pr-4">{faq.q}</span>
                        <svg className={`w-5 h-5 text-[#1d9fa9] shrink-0 transition-transform ${faqOpen === i ? "rotate-45" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      {faqOpen === i && <div className={`px-5 pb-5 text-sm ${t.textMid} leading-relaxed`}>{faq.a}</div>}
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}

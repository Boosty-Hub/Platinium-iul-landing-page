import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";

const PAGE_FAQS = [
  { q: "¿Necesito Seguro Social para aplicar?", a: "No. Puedes aplicar con ITIN (Individual Taxpayer Identification Number) o con pasaporte vigente de tu país de origen. La Sección 7702 del Código Fiscal de EE.UU. no requiere SSN para acceder a este tipo de póliza." },
  { q: "¿Es legal tener un seguro de vida con ITIN o Pasaporte?", a: "Sí, completamente legal. El ITIN fue creado por el IRS para que personas sin SSN puedan cumplir con sus obligaciones tributarias y acceder a servicios financieros. Las aseguradoras autorizadas aceptan ITIN y pasaporte como documentación válida bajo la Sec. 7702." },
  { q: "¿Mi información es confidencial? ¿Puede verla Inmigración?", a: "Absoluta confidencialidad. Las aseguradoras están reguladas por leyes estatales y federales de privacidad que prohíben compartir tu información con agencias de inmigración o cualquier entidad gubernamental. Tu privacidad está protegida por ley." },
  { q: "¿Pueden cancelar mi póliza si mi estatus migratorio cambia?", a: "No. Una vez aprobada, tu póliza es un contrato legal independiente de tu estatus migratorio. Si tu situación cambia, el contrato permanece vigente mientras mantengas los pagos activos." },
  { q: "¿Qué documentos necesito para aplicar?", a: "Con ITIN: ITIN vigente, identificación con foto (pasaporte, matrícula consular), comprobante de domicilio en EE.UU. y declaraciones de impuestos de los últimos 2-3 años. Con pasaporte: pasaporte vigente de tu país de origen y comprobante de domicilio en EE.UU." },
  { q: "¿Qué pasa con mi póliza si regreso a mi país?", a: "Tu póliza es un contrato en EE.UU. que puede mantenerse activa independientemente de dónde vivas, siempre que continues pagando las primas. Tus beneficiarios pueden cobrar el beneficio desde cualquier país. Es completamente portable." },
  { q: "¿Puedo hacer el plan a nombre de mis hijos?", a: "Sí. Como titular con ITIN o pasaporte, puedes abrir una póliza sobre la vida de tus hijos menores. Tú eres el propietario legal del contrato y puedes transferírselo cuando sean adultos. Conoce más en nuestra página de plan para hijos." },
];

export default function IULParaIndocumentados() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro de Vida con ITIN o Pasaporte — Sin SSN | Platinium"
            description="Aplica a un IUL con ITIN o Pasaporte vigente, sin Seguro Social. Respaldo legal bajo la Sección 7702. Confidencial, en español, con asesor licenciado. Cotiza gratis."
            keywords="seguro de vida con ITIN, IUL con ITIN, seguro de vida sin Seguro Social, IUL con pasaporte, ahorro USA sin SSN, seguro vida inmigrantes USA, seguro vida Tax ID, seguro de vida para inmigrante Miami"
            canonical={`${DOMAIN}/seguro-vida-itin`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "IUL con ITIN o Pasaporte", item: `${DOMAIN}/seguro-vida-itin` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                name: "IUL con ITIN o Pasaporte — Sin Seguro Social",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Seguro de vida IUL accesible con ITIN o pasaporte vigente bajo la Sección 7702 del Código Fiscal de EE.UU. Sin requisito de SSN.",
                areaServed: { "@type": "State", name: "Florida" },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL con ITIN o Pasaporte" }]} t={t} />

          {/* HERO — 2 columnas */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">🌎 ITIN · Pasaporte · Sin SSN</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Acumula capital libre de impuestos en EE.UU.{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      con ITIN o Pasaporte — sin Seguro Social
                    </span>
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    Los contratos bajo la <strong className={t.text}>Sección 7702 del Código Fiscal de EE.UU.</strong> pertenecen al derecho comercial privado y son accesibles con ITIN o pasaporte vigente. Tu estatus migratorio no limita tu derecho a construir riqueza en este país.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "⚖️", text: "100% legal bajo la Sec. 7702 del IRS — acceso nativo para ITIN y Pasaporte" },
                      { icon: "🔒", text: "Confidencialidad absoluta — tu información nunca se comparte con Inmigración" },
                      { icon: "💰", text: "Acumula valor en efectivo con piso del 0% — si la bolsa cae, tu saldo no pierde" },
                      { icon: "✈️", text: "Póliza portable — permanece activa si regresas a tu país de origen" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${t.textMuted} italic`}>
                    Asesor especialista en ITIN/Pasaporte · Atención en español · Sin compromiso
                  </p>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" inline />
                </Anim>
              </div>
            </div>
          </section>

          {/* MITOS VS REALIDAD — inmediatamente después del hero */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} text-center mb-8`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Las dos creencias que frenan a miles de familias hispanas
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    myth: "MITO #1: \"Los seguros solo sirven si falleces o si dejas dinero a alguien\"",
                    reality: "REALIDAD — Beneficios en vida activos: El valor en efectivo se acumula desde el primer año y puedes usarlo en vida para emergencias, invalidez, enfermedades crónicas o como sueldo de retiro libre de impuestos.",
                    mythColor: "text-red-500",
                    realityColor: "text-emerald-500",
                  },
                  {
                    myth: "MITO #2: \"Necesitas Seguro Social (SSN) para ahorrar legalmente en EE.UU.\"",
                    reality: "REALIDAD — Garantía legal aprobada con ITIN: Los contratos bajo la Sección 7702 están respaldados por el derecho mercantil privado. El ITIN es una vía 100% legal para abrir estos planes. Tu estatus migratorio no altera tus derechos de propiedad privada.",
                    mythColor: "text-red-500",
                    realityColor: "text-emerald-500",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-xl overflow-hidden backdrop-blur-xl`}>
                      <div className={`p-5 border-b border-red-500/20`}>
                        <div className="flex items-start gap-3">
                          <span className="text-red-500 font-bold text-xl shrink-0">✗</span>
                          <p className={`text-sm font-semibold ${item.mythColor} line-through leading-relaxed`}>{item.myth}</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <CheckIcon className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.reality}</p>
                        </div>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* LA REALIDAD LEGAL */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que dice la ley: acceso real con <span className="italic text-[#1d9fa9]">ITIN o Pasaporte</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  La Sección 7702 del Internal Revenue Code regula los seguros de vida en EE.UU. y no exige SSN como requisito de acceso. No es un vacío legal — es la norma vigente bajo el derecho comercial privado.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: "📄", title: "Con ITIN (Tax ID)", desc: "El ITIN del IRS es identificación tributaria válida para aplicar. Necesitas haberlo usado para declarar impuestos. No requieres SSN ni residencia legal." },
                  { icon: "🛂", title: "Con Pasaporte vigente", desc: "El pasaporte de tu país de origen, combinado con comprobante de domicilio en EE.UU., es documentación válida para muchas aseguradoras bajo la Sec. 7702." },
                  { icon: "🔒", title: "Confidencialidad garantizada por ley", desc: "Las aseguradoras están reguladas por leyes de privacidad que prohíben compartir tu información con agencias de inmigración o cualquier entidad gubernamental." },
                  { icon: "📋", title: "Contrato de derecho privado", desc: "Una vez emitida, tu póliza es un contrato legal que no puede ser cancelado por cambios en tu estatus migratorio, siempre que mantengas los pagos acordados." },
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

          {/* DOCUMENTACIÓN */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Qué documentos necesitas para <span className="italic text-[#1d9fa9]">aplicar</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: "📋",
                    title: "Opción A — Con ITIN",
                    docs: ["ITIN vigente del IRS", "Declaraciones de impuestos (últimos 2-3 años)", "Comprobante de domicilio en EE.UU. (recibo de servicios o contrato de alquiler)", "Identificación con foto (pasaporte, matrícula consular)"],
                  },
                  {
                    icon: "🛂",
                    title: "Opción B — Con Pasaporte",
                    docs: ["Pasaporte vigente de tu país de origen con foto", "Comprobante de domicilio en EE.UU.", "Comprobante de ingresos (carta patronal, estados de cuenta o tax returns si disponibles)"],
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <ul className="space-y-2">
                        {item.docs.map((doc, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckIcon className="text-[#1d9fa9] shrink-0 mt-0.5" />
                            <span className={`text-sm ${t.textMid}`}>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* PORTABILIDAD */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Qué pasa si regresas a tu <span className="italic text-[#1d9fa9]">país de origen</span>?
                </h2>
              </Anim>
              <div className={`${t.card} border rounded-2xl p-8 backdrop-blur-xl`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: "✈️", title: "La póliza viaja contigo", desc: "El contrato fue emitido en EE.UU. y permanece vigente sin importar tu país de residencia, siempre que mantengas la prima activa." },
                    { icon: "💰", title: "El valor en efectivo permanece tuyo", desc: "El fondo acumulado no desaparece. Puedes seguir accediendo a él mediante préstamos de la póliza desde tu país de origen." },
                    { icon: "👨‍👩‍👧", title: "Tus beneficiarios cobran en cualquier país", desc: "El beneficio por fallecimiento se paga a quien tú designes, sin importar su ubicación, dentro de los términos del contrato." },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <span className="text-4xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* MÁS ALLÁ DEL SEGURO */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} text-center mb-8`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que puedes hacer con tu IUL <span className="italic text-[#1d9fa9]">más allá de la protección</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { icon: "❤️", title: "Beneficios en vida", desc: "Si te diagnostican una enfermedad crítica, crónica o terminal, puedes acceder al beneficio antes de fallecer para cubrir gastos médicos y del hogar.", href: "/beneficios-en-vida", label: "Ver beneficios en vida →" },
                  { icon: "🏖️", title: "Retiro privado propio", desc: "El valor en efectivo acumulado es tu fondo de jubilación. Accesible mediante préstamos de la póliza, sin penalidades por edad ni RMD.", href: "/proteccion-familiar", label: "Ver IUL para retiro →" },
                  { icon: "👶", title: "Plan para tus hijos", desc: "Con ITIN o pasaporte puedes diseñar una póliza sobre la vida de tus hijos menores. La cobertura de por vida queda asegurada desde joven.", href: "/iul-para-hijos", label: "Ver plan para hijos →" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed mb-3`}>{item.desc}</p>
                      <Link to={item.href} className="text-[#1d9fa9] text-sm font-semibold hover:underline">{item.label}</Link>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* PROCESO PASO A PASO */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cómo comenzar en <span className="italic text-[#1d9fa9]">3 pasos</span>
                </h2>
              </Anim>
              <div className="space-y-5">
                {[
                  { step: "01", title: "Completa el formulario (5 minutos)", desc: "Datos básicos: nombre, edad aproximada, aportación estimada, meta principal y tipo de identificación (ITIN o pasaporte). Sin documentos en esta etapa." },
                  { step: "02", title: "Habla con un asesor especialista", desc: "Un asesor de Platinium especializado en ITIN/Pasaporte te llama en español para revisar tu caso, responder dudas y confirmar los parámetros de tu plan." },
                  { step: "03", title: "Recibe tu proyección en PDF", desc: "El asesor prepara tu ilustración personalizada con cobertura, valor en efectivo estimado por año y prima mensual. Sin presión de contratación." },
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
              <Anim delay={0.3}>
                <div className="mt-10 text-center">
                  <Link
                    to="/cotizacion-iul"
                    className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-lg font-bold no-underline hover:shadow-lg transition-all"
                  >
                    Diseña tu plan con ITIN o Pasaporte →
                  </Link>
                  <p className={`text-xs ${t.textMuted} mt-3`}>Gratis · Asesor especialista en español · Sin compromiso</p>
                </div>
              </Anim>
            </div>
          </section>

          {/* FAQ */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre <span className="italic text-[#1d9fa9]">IUL con ITIN o Pasaporte</span>
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

              <Anim delay={0.3}>
                <div className="mt-8 text-center flex flex-wrap justify-center gap-4">
                  <Link to="/seguro-de-vida-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← ¿Qué es el IUL?</Link>
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Protección y retiro con IUL →</Link>
                </div>
              </Anim>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}

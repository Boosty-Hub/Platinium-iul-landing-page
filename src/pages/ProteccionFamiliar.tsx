import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";

const PAGE_FAQS = [
  { q: "¿El IUL solo sirve cuando fallezco?", a: "No. El IUL tiene dos funciones simultáneas: proteger a tu familia si falleces, y acumular un fondo de valor en efectivo que tú puedes usar en vida para el retiro. Además, los riders de enfermedades críticas, crónicas y terminales te permiten acceder al beneficio si te diagnostican una condición grave — sin necesidad de fallecer." },
  { q: "¿Puedo retirar mi dinero sin impuestos antes de los 65?", a: "Bajo la Sección 7702 del Código Fiscal de EE.UU., los préstamos sobre el valor en efectivo pueden ser libres de impuestos y sin penalidades por edad, siempre que la póliza esté activa y correctamente estructurada. A diferencia del 401k, no hay multa del 10% por acceso anticipado." },
  { q: "¿Qué pasa con el retiro si mi póliza caduca?", a: "Si la póliza caduca antes de que liquides los préstamos, podría generarse una obligación fiscal. Por eso es fundamental mantener la póliza activa y diseñarla correctamente con un asesor licenciado desde el inicio." },
  { q: "¿Puedo aplicar sin Seguro Social?", a: "Sí. El IUL es accesible con ITIN o pasaporte vigente bajo la Sec. 7702. Tu estatus migratorio no determina tu acceso. Más detalles en nuestra página de acceso con ITIN." },
  { q: "¿Cuánto necesito aportar para tener un retiro real?", a: "Con $200–$400 mensuales iniciando a los 35 años es posible acumular un fondo significativo para acceder a los 60–65. Un asesor calcula proyecciones específicas según tu caso real — sin promedios genéricos." },
  { q: "¿El valor en efectivo puede bajar si el mercado cae?", a: "No. El mecanismo de indexación al S&P 500 incluye un piso del 0%. Si el mercado cae, tu rendimiento ese año es del 0% — tu saldo no retrocede. Las ganancias acumuladas quedan consolidadas y no pierdes el capital." },
];

export default function ProteccionFamiliar() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="IUL: Protección Familiar y Retiro en Uno | Platinium"
            description="Un IUL protege a tu familia si algo te pasa y acumula valor para tu retiro privado. Sin SSN — aplica con ITIN o pasaporte. Cotiza gratis con asesor en español."
            keywords="seguro de vida con ahorro para retiro, IUL protección y retiro, protección familiar y jubilación, IUL para retiro privado, ahorro retiro USA latinos, alternativa retiro privado, seguro de vida familiar Miami"
            canonical={`${DOMAIN}/proteccion-familiar`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "Protección Familiar y Retiro", item: `${DOMAIN}/proteccion-familiar` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                name: "IUL — Protección Familiar y Plan de Retiro Privado",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "IUL que combina protección familiar por fallecimiento con acumulación de valor en efectivo para retiro privado. Accesible con SSN, ITIN o pasaporte.",
                areaServed: { "@type": "State", name: "Florida" },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "Protección Familiar y Retiro" }]} t={t} />

          {/* HERO — 2 columnas */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">🏠 Protección + Retiro en un solo plan</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Protege a tu familia y{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      construye tu retiro privado
                    </span>{" "}
                    con un solo contrato
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    El IUL no es solo un seguro de vida. Cada prima mensual trabaja en dos direcciones simultáneas: garantiza el bienestar de tu familia si tú faltas, y acumula un fondo de valor en efectivo que tú puedes usar para tu retiro bajo la <strong className="text-[#1d9fa9]">Sección 7702</strong>. Con SSN, ITIN o Pasaporte.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "🛡️", text: "Protección desde el día uno — beneficio por fallecimiento libre de impuestos para tu familia" },
                      { icon: "📈", text: "Valor en efectivo que crece indexado al S&P 500 con piso del 0% — sin riesgo de mercado" },
                      { icon: "💸", text: "Retiros libres de impuestos para retiro bajo la Sec. 7702, sin penalidades por edad" },
                      { icon: "❤️", text: "Riders de enfermedades graves — accede al beneficio si te diagnostican una condición crítica" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${t.textMuted} italic`}>
                    Aplica con SSN, ITIN o Pasaporte · Asesoría en español · Sin compromiso
                  </p>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" inline />
                </Anim>
              </div>
            </div>
          </section>

          {/* MITOS VS REALIDAD — después del hero */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} text-center mb-8`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Las creencias que frenan a la mayoría
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    myth: "MITO: \"El seguro de vida solo sirve cuando me muera\"",
                    reality: "REALIDAD — El valor en efectivo se acumula desde el primer año y puedes usarlo en vida: para retiro, emergencias, enfermedades crónicas o críticas. No tienes que morir para que tu dinero trabaje.",
                  },
                  {
                    myth: "MITO: \"No califico porque no tengo Seguro Social\"",
                    reality: "REALIDAD — Los contratos bajo la Sec. 7702 son accesibles con ITIN o pasaporte vigente. Tu estatus migratorio no altera tus derechos de propiedad privada bajo el derecho comercial de EE.UU.",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-xl overflow-hidden backdrop-blur-xl`}>
                      <div className="p-5 border-b border-red-500/20">
                        <div className="flex items-start gap-3">
                          <span className="text-red-500 font-bold text-xl shrink-0">✗</span>
                          <p className="text-sm font-semibold text-red-500 line-through leading-relaxed">{item.myth}</p>
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

          {/* EL DOBLE BENEFICIO */}
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Por qué el IUL hace <span className="italic text-[#1d9fa9]">dos cosas a la vez</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-12 text-[15px]`}>
                  Cada prima se divide en dos partes: una cubre el costo del seguro de vida, la otra va a tu componente de ahorro (Cash Value). Ambos trabajan desde el primer mes.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: "🛡️",
                    tag: "Para tu familia",
                    title: "Protección por fallecimiento",
                    desc: "Si falleces mientras la póliza está activa, tus beneficiarios reciben el beneficio libre de impuestos federales. Cubre hipoteca, deudas, gastos escolares, nivel de vida — todo lo que tú sostenías.",
                    items: ["Desde $250,000+ libre de impuestos federales", "Cubre hipoteca, deudas y nivel de vida", "Riders de enfermedades graves incluidos", "Cobertura permanente — no expira como el Term Life"],
                  },
                  {
                    icon: "📈",
                    tag: "Para ti",
                    title: "Acumulación para tu retiro",
                    desc: "El valor en efectivo crece indexado al S&P 500 con piso del 0%. Bajo la Sección 7702, puedes acceder a él mediante préstamos de la póliza — libres de impuestos y sin las penalidades del 401k — siempre que la póliza permanezca activa.",
                    items: ["Crecimiento indexado al S&P 500", "Piso del 0% — no participas de las caídas", "Acceso sin penalidad por edad, sin RMD", "Retiros estructurados libres de impuestos bajo Sec. 7702*"],
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-8 backdrop-blur-xl`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <div className="text-xs font-bold tracking-widest uppercase text-[#1d9fa9] mb-2">{item.tag}</div>
                      <h3 className={`text-xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed mb-4`}>{item.desc}</p>
                      <ul className="space-y-2">
                        {item.items.map((pt, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckIcon className="text-[#1d9fa9] shrink-0 mt-0.5" />
                            <span className={`text-sm ${t.textMid}`}>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.2}>
                <p className={`text-[11px] ${t.textMuted} italic mt-4 text-center`}>
                  *Los retiros libres de impuestos aplican cuando la póliza está correctamente estructurada bajo la Sec. 7702 y permanece activa. Consulta con tu asesor licenciado.
                </p>
              </Anim>
            </div>
          </section>

          {/* CÓMO SE ACUMULA EL RETIRO */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cómo se construye tu <span className="italic text-[#1d9fa9]">fondo de retiro privado</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  El mecanismo es matemáticamente asimétrico: capturas las subidas del S&P 500 (hasta el cap del contrato) y tienes un piso del 0% en las caídas. Cada año de ganancias queda consolidado — tu saldo solo crece o se mantiene igual.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { icon: "📊", title: "Indexado al S&P 500", desc: "Tu Cash Value gana intereses basados en el rendimiento del índice. No se invierte directamente en bolsa — sin exposición directa al riesgo bursátil." },
                  { icon: "🛡️", title: "Piso del 0%", desc: "Si el mercado cae un -20%, tu rendimiento ese año es del 0%. Las ganancias de años anteriores quedan consolidadas. No retrocedes." },
                  { icon: "💰", title: "Acceso flexible", desc: "Accedes al valor acumulado mediante préstamos de la póliza antes de los 65 — sin las penalidades del 401k ni las restricciones de edad del sistema tradicional." },
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

              {/* Rangos de aportación */}
              <Anim delay={0.2}>
                <div className={`${t.card} border rounded-2xl p-8 backdrop-blur-xl`}>
                  <h3 className={`text-xl font-semibold ${t.text} mb-6 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Rangos de aportación según tu meta de retiro
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { rango: "$100 – $200 / mes", perfil: "Plan de inicio", desc: "Protección básica + acumulación progresiva. Ideal para quienes comienzan." },
                      { rango: "$200 – $400 / mes", perfil: "Plan intermedio ✦", desc: "Protección sólida + fondo de retiro relevante en 20-25 años.", highlight: true },
                      { rango: "$400 – $800 / mes", perfil: "Plan acelerado", desc: "Máxima acumulación. Para quienes empiezan más tarde o tienen una meta ambiciosa." },
                    ].map((item, i) => (
                      <div key={i} className={`${i === 1 ? "border-2 border-[#1d9fa9]" : "border border-[#1d9fa9]/20"} rounded-xl p-5 text-center`}>
                        <div className="text-[#1d9fa9] font-bold text-lg mb-1">{item.rango}</div>
                        <div className={`text-xs font-bold tracking-widest uppercase ${t.textMuted} mb-2`}>{item.perfil}</div>
                        <p className={`text-xs ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[11px] ${t.textMuted} italic mt-4 text-center`}>Proyecciones ilustrativas. Los resultados reales dependen de la edad, salud y diseño de la póliza. Un asesor licenciado entrega tu proyección personalizada.</p>
                </div>
              </Anim>
            </div>
          </section>

          {/* BENEFICIOS EN VIDA */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Usa tu IUL si te enfermas —{" "}
                  <span className="italic text-[#1d9fa9]">sin necesidad de fallecer</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  Los riders de enfermedades graves te dan acceso al beneficio en vida si te diagnostican una condición cubierta. Es protección real en el momento que más la necesitas.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🩺", title: "Enfermedad crónica", desc: "Si no puedes realizar actividades básicas diarias por 90+ días (Alzheimer, Parkinson, esclerosis múltiple), puedes adelantar parte del beneficio." },
                  { icon: "💔", title: "Enfermedad crítica", desc: "Cáncer, infarto, derrame cerebral, trasplante de órganos — recibes un adelanto del beneficio para cubrir tratamiento y gastos del hogar." },
                  { icon: "🕊️", title: "Enfermedad terminal", desc: "Si tu expectativa de vida es 12-24 meses, puedes acceder a la mayor parte del beneficio para usarlo en vida con tu familia." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.3}>
                <p className={`text-center mt-6 text-sm ${t.textMid}`}>
                  <Link to="/beneficios-en-vida" className="text-[#1d9fa9] font-semibold hover:underline">
                    Ver guía completa de beneficios en vida →
                  </Link>
                </p>
              </Anim>
            </div>
          </section>

          {/* ENLACES CONTEXTUALES */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Profundiza en lo que más <span className="italic text-[#1d9fa9]">te interesa</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { title: "¿Qué es un IUL?", desc: "Guía completa del producto: los tres pilares, la fórmula del piso del 0% y para quién aplica.", href: "/seguro-de-vida-iul", icon: "📚" },
                  { title: "IUL vs 401(k)", desc: "Comparativa de 4 columnas: IUL, 401k, Roth IRA y Traditional IRA. Los ejes que el mercado no muestra.", href: "/iul-vs-401k", icon: "⚖️" },
                  { title: "Seguro con ITIN o Pasaporte", desc: "Acceso legal sin Seguro Social. Documentación, legalidad, confidencialidad y portabilidad.", href: "/seguro-vida-itin", icon: "🌎" },
                  { title: "Beneficios en Vida", desc: "Accede al beneficio si te diagnostican una enfermedad grave — sin necesidad de fallecer.", href: "/beneficios-en-vida", icon: "❤️" },
                  { title: "Plan para tus Hijos", desc: "Cobertura de por vida asegurada desde joven + fondo para universidad, primera casa o negocio.", href: "/iul-para-hijos", icon: "👶" },
                  { title: "Cotiza tu Plan", desc: "Proyección personalizada en PDF. Gratis, en español y sin compromiso.", href: "/cotizacion-iul", icon: "📋" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <Link to={item.href} className="no-underline block h-full">
                      <div className={`${t.card} border rounded-2xl p-6 h-full backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1d9fa9]/30`}>
                        <span className="text-3xl mb-3 block">{item.icon}</span>
                        <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                        <p className={`text-sm ${t.textMuted}`}>{item.desc}</p>
                        <span className="text-[#1d9fa9] text-sm font-semibold mt-3 block">Ver más →</span>
                      </div>
                    </Link>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre <span className="italic text-[#1d9fa9]">protección y retiro con IUL</span>
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

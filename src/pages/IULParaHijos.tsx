import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";

const PAGE_FAQS = [
  { q: "¿Mi hijo necesita SSN para tener el plan?", a: "No necesariamente. El titular de la póliza eres tú (el padre, madre o tutor legal), no el niño. Si tú tienes ITIN o pasaporte vigente, puedes ser el propietario del contrato sobre la vida de tu hijo." },
  { q: "¿Puedo retirar yo el dinero si lo necesito antes?", a: "Sí. Como titular, tienes acceso al valor en efectivo mediante préstamos de la póliza. Esto te da flexibilidad si surge una emergencia familiar, aunque el objetivo principal es que el fondo crezca para cuando tu hijo lo necesite." },
  { q: "¿Qué pasa cuando mi hijo cumpla 18 años?", a: "Como titular, puedes transferirle la póliza a él/ella cuando sea mayor de edad. Tu hijo pasa a ser propietario del contrato con la cobertura de por vida ya aprobada y el valor acumulado a su favor — sin necesidad de pasar por un nuevo proceso de aprobación médica." },
  { q: "¿Es mejor empezar joven o esperar a que el niño sea adulto?", a: "Empezar joven tiene dos ventajas que no se pueden recuperar: el costo del seguro a edades tempranas es muy bajo (el 90% de la prima va al componente de ahorro), y el interés compuesto tiene décadas más para trabajar. Un mismo aporte mensual produce un resultado mucho mayor si empieza a los 5 años que a los 20." },
  { q: "¿El valor en efectivo puede usarse para la universidad?", a: "Sí. El valor acumulado puede accederse mediante préstamos de la póliza para pagar la universidad. No tiene restricciones sobre el uso del dinero — a diferencia del plan 529, puede usarse para cualquier meta: educación, primera casa, emprendimiento." },
  { q: "¿Qué condiciones médicas del niño pueden bloquear la aprobación?", a: "Condiciones serias pueden limitar el acceso o aumentar el costo. Sin embargo, una vez aprobada la póliza, la cobertura es permanente sin importar qué condiciones médicas desarrolle el niño en su adultez. Esa asegurabilidad de por vida es la mayor ventaja de iniciar en edad temprana." },
];

export default function IULParaHijos() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="IUL para Hijos: Seguro e Inversión desde la Infancia | Platinium"
            description="Un IUL para tus hijos crece con el tiempo: cobertura de por vida asegurada + fondo para universidad, primera casa o negocio. El 90% de la prima va al ahorro. Con ITIN."
            keywords="seguro de vida para niños, IUL para hijos, ahorro para la universidad de mis hijos USA, seguro vida para mis hijos, plan ahorro hijos USA, IUL infantil, ahorro indexado para niños, seguro de vida para menores"
            canonical={`${DOMAIN}/iul-para-hijos`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "IUL para Hijos", item: `${DOMAIN}/iul-para-hijos` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                name: "IUL para Hijos — Seguro e Inversión desde la Infancia",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Plan IUL sobre la vida de menores. Cobertura de por vida asegurada + acumulación de valor en efectivo para universidad, vivienda o emprendimiento.",
                areaServed: { "@type": "Country", name: "United States" },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL para Hijos" }]} t={t} />

          {/* HERO — 2 columnas */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">👶 El multiplicador de riqueza infantil</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    Compra una ventaja financiera de 20 años{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      para tus hijos
                    </span>
                    {" "}usando interés compuesto seguro
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    Cuando empiezas en la infancia, el costo del seguro es mínimo — el 90% de cada aportación va directo al componente de ahorro indexado. Décadas de interés compuesto más una cobertura de por vida asegurada antes de que ninguna condición médica futura lo complique.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "⚡", text: "Hackeo del tiempo: el costo infantil es bajo, el 90% de la prima va al ahorro indexado" },
                      { icon: "💸", text: "Retiros potencialmente libres de impuestos para universidad, vivienda o emprendimiento" },
                      { icon: "🏥", text: "Asegurabilidad de por vida: la cobertura no puede cancelarse por condiciones médicas futuras" },
                      { icon: "🌎", text: "Aplica con ITIN o Pasaporte del padre o tutor — sin necesitar SSN del menor" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${t.textMuted} italic`}>
                    Aplica con ITIN o Pasaporte del titular · Asesoría en español · Sin compromiso
                  </p>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" inline cardTitle="Cotiza el plan IUL para tus hijos — gratis" />
                </Anim>
              </div>
            </div>
          </section>

          {/* BANNER CTA */}
          <section className="px-6 pb-6">
            <ContactBar t={t} compact />
          </section>

          {/* USOS DEL DINERO */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Para qué puede usar ese dinero <span className="italic text-[#1d9fa9]">tu hijo cuando sea adulto</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  El valor en efectivo acumulado no tiene restricciones de uso. Lo que a los 18 ó 25 años haga tu hijo con ese capital depende solo de él — no de reglas del IRS, no de criterios de elegibilidad.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "🎓", title: "Universidad sin deuda", desc: "Paga la universidad sin préstamos estudiantiles. El valor acumulado puede accederse mediante préstamos de la póliza — sin restricciones sobre qué carrera o institución elegir." },
                  { icon: "🏠", title: "Enganche de la primera casa", desc: "Muchos hijos adultos usan el valor de la póliza como enganche de su primera vivienda. Una ventaja que la mayoría de sus compañeros simplemente no tendrá." },
                  { icon: "💼", title: "Capital para emprender", desc: "Fondos disponibles para iniciar un negocio sin pedir prestado a un banco. El valor en efectivo puede ser el capital inicial que cambie el rumbo de su carrera." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 text-center backdrop-blur-xl`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* POR QUÉ EMPEZAR JOVEN */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Porqué empezar joven{" "}
                  <span className="italic text-[#1d9fa9]">multiplica el resultado</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-12 text-[15px]`}>
                  No es sobre el monto mensual — es sobre los años. El mismo aporte mensual produce resultados radicalmente distintos según cuándo empieces.
                </p>
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    title: "Empiezas cuando tu hijo tiene 5 años",
                    aporte: "$400 / mes",
                    detail: "El costo del seguro infantil es prácticamente cero. El 90% de cada aportación va directo al componente de ahorro. 60 años de interés compuesto trabajan para tu hijo.",
                    tag: "Máximo potencial",
                    highlight: true,
                  },
                  {
                    title: "Esperas hasta que tu hijo tenga 20 años",
                    aporte: "$100 / mes",
                    detail: "El costo del seguro adulto es mayor. La prima se divide diferente. Solo 45 años de interés compuesto. El resultado final puede ser significativamente menor con el mismo aporte mensual.",
                    tag: "Menos eficiente",
                    highlight: false,
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-8 backdrop-blur-xl ${item.highlight ? "border-[#1d9fa9]/50" : ""}`}>
                      <div className={`text-xs font-bold tracking-widest uppercase mb-3 ${item.highlight ? "text-[#1d9fa9]" : t.textMuted}`}>{item.tag}</div>
                      <h3 className={`text-lg font-semibold ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <div className={`text-2xl font-bold ${item.highlight ? "text-[#1d9fa9]" : t.text} mb-3`}>{item.aporte}</div>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.detail}</p>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.2}>
                <p className={`text-[11px] ${t.textMuted} italic text-center`}>
                  Comparación ilustrativa. Los montos reales dependen del diseño de la póliza, aseguradora y rendimiento del índice. Solicita tu proyección personalizada para conocer tus números reales.
                </p>
              </Anim>
            </div>
          </section>

          {/* TRES VENTAJAS CLAVE */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Las tres ventajas que solo el tiempo <span className="italic text-[#1d9fa9]">puede darte</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: "⚡",
                    title: "El hackeo matemático del tiempo",
                    desc: "A edades infantiles, el costo del seguro es mínimo — prácticamente cero. Eso significa que el 90% de cada dólar que aportas va directo al componente de ahorro indexado, donde el interés compuesto lo multiplica durante décadas.",
                  },
                  {
                    icon: "💸",
                    title: "Capital libre de impuestos cuando más importa",
                    desc: "Tu hijo podrá acceder al valor acumulado, potencialmente libre de impuestos bajo la Sec. 7702, para costear su universidad, liquidar la inicial de su primera propiedad o fundar su primer negocio. Sin restricciones de uso.",
                  },
                  {
                    icon: "🏥",
                    title: "Asegurabilidad de por vida bloqueada",
                    desc: "Una vez aprobada la póliza, la cobertura es permanente — sin importar qué condiciones médicas desarrolle tu hijo en su adultez. Diabetes, hipertensión, lo que sea: si la póliza ya existe, la cobertura ya está garantizada.",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 h-full backdrop-blur-xl`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* CÓMO SE ESTRUCTURA */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cómo funciona el plan <span className="italic text-[#1d9fa9]">a nombre del menor</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: "👨‍👩‍👧", title: "El padre o tutor es el titular legal", desc: "El adulto que inicia el plan es el propietario del contrato. Es quien paga las primas y tiene acceso al valor en efectivo si lo necesita en una emergencia." },
                  { icon: "👶", title: "El menor es el asegurado", desc: "El niño o niña es la vida asegurada. La cobertura se aprueba con base en su estado de salud al momento de la solicitud — sin importar condiciones futuras." },
                  { icon: "🔄", title: "Transferencia cuando cumpla la mayoría", desc: "Cuando el hijo sea mayor de edad, el titular puede transferirle la propiedad del contrato. El hijo hereda la cobertura de por vida y el valor acumulado ya construido." },
                  { icon: "🌎", title: "Aplica con ITIN o Pasaporte del titular", desc: "Como padre o tutor con ITIN o pasaporte vigente, puedes abrir el plan. El acceso sin SSN aplica también para estos contratos familiares bajo la Sec. 7702." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim delay={0.3}>
                <p className={`text-center mt-8 text-sm ${t.textMid}`}>
                  ¿Tienes ITIN o Pasaporte y quieres confirmar tu acceso?{" "}
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold hover:underline">
                    Ver guía de acceso sin SSN →
                  </Link>
                </p>
              </Anim>
            </div>
          </section>

          {/* APORTACIONES */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Aportaciones <span className="italic text-[#1d9fa9]">a tu medida</span>
                </h2>
                <p className={`${t.textMid} mb-10 text-[15px]`}>
                  No hay un monto fijo. El plan se diseña según tu capacidad y la edad de tu hijo. A menor edad del niño, mayor eficiencia de cada aportación.
                </p>
              </Anim>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { range: "$100 – $150", label: "Plan base" },
                  { range: "$100 – $250", label: "Plan equilibrado ✦", highlight: true },
                  { range: "$250 – $500", label: "Plan acelerado" },
                  { range: "$500+", label: "Plan élite" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.07}>
                    <div className={`${t.card} border rounded-xl p-5 ${item.highlight ? "border-[#1d9fa9]" : ""}`}>
                      <div className="text-[#1d9fa9] font-bold text-base mb-1">{item.range}</div>
                      <div className={`text-xs font-bold ${t.text} uppercase tracking-wide`}>{item.label}</div>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.15}>
                <div className={`${t.card} border border-dashed border-[#1d9fa9]/50 rounded-xl p-4 mt-2 text-center`}>
                  <div className="text-[#1d9fa9] font-bold text-base mb-1">Personalizado</div>
                  <div className={`text-xs font-bold ${t.text} uppercase tracking-wide mb-1`}>A tu medida</div>
                  <div className={`text-xs ${t.textMuted}`}>Para objetivos específicos — el asesor diseña el monto según la edad del niño</div>
                </div>
              </Anim>
              <Anim delay={0.2}>
                <p className={`text-[11px] ${t.textMuted} italic`}>Rangos orientativos. El diseño exacto lo calcula el asesor según la edad del niño, tu presupuesto y la meta.</p>
              </Anim>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cada año que esperas es un año de interés compuesto que no recuperas
                </h2>
                <p className={`${t.textMid} mb-6 text-[15px]`}>
                  Solicita tu proyección personalizada. Un asesor licenciado de Platinium diseña el plan según la edad de tu hijo, tu presupuesto y tu meta. Gratis, en español, sin compromiso.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/cotizacion-iul"
                    className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-lg font-bold no-underline hover:shadow-lg transition-all"
                  >
                    Solicita el plan para tus hijos →
                  </Link>
                </div>
                <p className={`text-xs ${t.textMuted} mt-3`}>Aplica con ITIN o Pasaporte · Asesoría en español · Sin compromiso</p>
              </Anim>
            </div>
          </section>

          {/* ENLACES */}
          <section className={`${t.bg2} py-12 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <p className={`text-sm ${t.textMid} mb-4`}>¿Quieres ver el contexto familiar completo o confirmar tu acceso con ITIN?</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/seguro-de-vida-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← ¿Qué es el IUL?</Link>
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Protección familiar y retiro →</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Acceso con ITIN →</Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes de <span className="italic text-[#1d9fa9]">padres sobre el plan IUL</span>
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

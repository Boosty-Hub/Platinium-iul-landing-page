import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";

const PAGE_FAQS = [
  { q: "¿Puedo tener un IUL y un 401k al mismo tiempo?", a: "Sí. Son instrumentos complementarios, no excluyentes. La estrategia más común: aprovechar el employer matching del 401k hasta el tope (dinero gratuito), y canalizar el excedente a un IUL para agregar protección familiar, acceso anticipado sin penalidad y cobertura contra caídas del mercado." },
  { q: "¿Qué pasa con mi 401k si dejo mi trabajo?", a: "Tienes varias opciones: dejarlo en el plan del ex empleador, hacer un rollover a un IRA, o retirarlo pagando impuestos y la penalidad del 10%. El IUL no tiene este problema porque es un contrato personal que no depende de tu relación laboral." },
  { q: "¿Por qué el 401k puede ser una 'bomba de tiempo fiscal'?", a: "El 401k tradicional te ahorra impuestos hoy, pero te obliga a pagar impuestos sobre el 100% de lo que retires en el futuro. Si las tasas impositivas suben en los próximos 20-30 años, entregarías al IRS una porción significativa de lo que acumulaste. El IUL, bajo la Sec. 7702, permite retiros libres de esa carga si la póliza permanece activa." },
  { q: "¿El IUL tiene límites de contribución del IRS?", a: "El IUL se diseña bajo la Sección 7702, que establece parámetros para que la póliza no sea clasificada como Modified Endowment Contract (MEC). Dentro de esos parámetros, la aportación se ajusta a la capacidad del titular y los objetivos del contrato — no hay un tope fijo como el del 401k." },
  { q: "¿Cuál da más rendimiento: el IUL o el 401k?", a: "Depende del mercado y el horizonte temporal. El 401k captura el upside completo del mercado, pero también absorbe las caídas. El IUL captura el upside hasta el cap y tiene piso del 0%. En mercados volátiles, el IUL suele preservar mejor el capital acumulado al no participar de las caídas." },
  { q: "¿Qué es el Roth IRA y en qué se diferencia del IUL?", a: "El Roth IRA es una cuenta de retiro con contribuciones post-impuesto y retiros libres de impuestos después de los 59½. A diferencia del IUL, no incluye protección por fallecimiento, no tiene piso contra pérdidas del mercado, tiene límite de contribución anual del IRS ($7,000 en 2024) y no está disponible para personas con ITIN." },
];

export default function IULvs401k() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="IUL vs 401k vs Roth IRA: Comparativa Completa | Platinium"
            description="Compara IUL, 401k, Roth IRA y Traditional IRA: impuestos, acceso anticipado, límites y acceso con ITIN. Tabla de 4 columnas sin letras pequeñas."
            keywords="IUL vs 401k, IUL vs Roth IRA, IUL vs IRA, diferencia IUL 401k, alternativa al 401k, mejor que un 401k, IUL o 401k cuál es mejor, penalidades del 401k hispanos Miami, bomba de tiempo fiscal 401k"
            canonical={`${DOMAIN}/iul-vs-401k`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "IUL vs 401k", item: `${DOMAIN}/iul-vs-401k` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL vs 401(k)" }]} t={t} />

          {/* HERO — 2 columnas */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">⚖️ Comparativa Transparente</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    IUL vs 401(k) vs Roth IRA:{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      la verdad financiera sin filtros
                    </span>
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    No todos los instrumentos de retiro son iguales. El 401k tiene ventajas reales — especialmente con employer matching. El IUL resuelve lo que el 401k no puede: protección familiar, acceso anticipado sin penalidad, y acceso con ITIN. Aquí comparas los cuatro con datos reales.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "🛡️", text: "Piso del 0%: si la bolsa cae, tu saldo IUL no retrocede ni un centavo" },
                      { icon: "💸", text: "Retiros estructurados libres de impuestos — el 401k tributa al 100% cuando retiras" },
                      { icon: "🔓", text: "Acceso anticipado sin penalidad — el 401k cobra 10% antes de los 59½" },
                      { icon: "🌎", text: "El IUL acepta ITIN o Pasaporte — el 401k requiere SSN y empleo formal" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${t.textMuted} italic`}>
                    El análisis completo incluye cuándo el 401k sí conviene — especialmente si tu empleador ofrece matching.
                  </p>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" inline />
                </Anim>
              </div>
            </div>
          </section>

          {/* POR QUÉ EL 401K PUEDE SER UNA TRAMPA FISCAL */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Lo que nadie te dice sobre el <span className="italic text-red-500">401k tradicional</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: "⏰",
                    title: "La bomba de tiempo fiscal diferida",
                    desc: "El 401k te ahorra impuestos hoy, pero acumulas una deuda impositiva futura. Cuando retires, pagas impuestos sobre el 100% — incluidas las ganancias acumuladas durante 30 años. Si las tasas fiscales suben en el futuro, el costo podría ser mayor de lo previsto.",
                    highlight: false,
                  },
                  {
                    icon: "📉",
                    title: "Exposición total al mercado",
                    desc: "Si el S&P 500 cae un -20%, tu saldo del 401k cae un -20%. Para recuperar ese capital necesitas que el mercado suba un +25%. El IUL opera con la regla matemática R = máx(0%, mín(R_mercado, Cap)): participas de las subidas, no de las caídas.",
                    highlight: false,
                  },
                  {
                    icon: "🔒",
                    title: "Tu dinero queda bloqueado hasta los 59½",
                    desc: "Retirar del 401k antes de los 59½ cuesta un 10% de penalidad federal más impuestos ordinarios. Si tienes una emergencia, una crisis de negocio o quieres acceder a tu propio dinero, pagas por ello. El IUL no tiene esa penalidad.",
                    highlight: false,
                  },
                  {
                    icon: "🔗",
                    title: "Está atado a tu empleo",
                    desc: "Si cambias de trabajo, cierras tu empresa o te despiden, el 401k se complica — tienes que hacer un rollover, dejarlo donde está o retirarlo pagando impuestos. El IUL es un contrato personal que no depende de tu relación laboral.",
                    highlight: false,
                  },
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
                <div className={`mt-8 ${t.card} border border-[#1d9fa9]/30 rounded-xl p-5 backdrop-blur-xl`}>
                  <p className={`text-sm ${t.textMid} text-center`}>
                    <strong className={t.text}>Nota importante:</strong> Si tu empleador ofrece matching en el 401k, ese es dinero gratis que deberías aprovechar hasta el tope. La estrategia inteligente es aprovechar el matching del 401k y diversificar el excedente en un IUL para protección adicional y flexibilidad.
                  </p>
                </div>
              </Anim>
            </div>
          </section>

          {/* TABLA COMPARATIVA 4 COLUMNAS */}
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  La tabla comparativa <span className="italic text-[#1d9fa9]">que el mercado evita mostrarte</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  Los cuatro instrumentos de retiro más comunes, comparados en los ejes que realmente importan para tu situación financiera en EE.UU.
                </p>
              </Anim>
              <Anim delay={0.1}>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[720px] ${t.divider} border rounded-xl overflow-hidden`}>
                    <thead>
                      <tr className={t.brandBg}>
                        <th className={`p-4 text-left text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Factor técnico</th>
                        <th className="p-4 text-center text-[11px] tracking-[2px] text-[#1d9fa9] uppercase font-bold">IUL (Sec. 7702)</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>401(k)</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Roth IRA</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Traditional IRA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { f: "Protección por fallecimiento", iul: "✅ Incluida", k: "❌ No", roth: "❌ No", tira: "❌ No" },
                        { f: "Crecimiento vinculado al mercado", iul: "✅ S&P 500", k: "✅ Fondos mutuos", roth: "✅ Fondos mutuos", tira: "✅ Fondos mutuos" },
                        { f: "Protección contra pérdidas (piso 0%)", iul: "✅ Garantizado", k: "❌ Riesgo total", roth: "❌ Riesgo total", tira: "❌ Riesgo total" },
                        { f: "Acceso antes de 59½ sin penalidad", iul: "✅ Préstamos*", k: "❌ 10% penalidad", roth: "⚠️ Solo contribuciones", tira: "❌ 10% penalidad" },
                        { f: "Retiros libres de impuestos", iul: "✅ Préstamos Sec. 7702*", k: "❌ 100% gravables", roth: "✅ Después de 59½", tira: "❌ 100% gravables" },
                        { f: "Límites de aportación anual (IRS)", iul: "Según Sec. 7702", k: "❌ $23,000/año", roth: "❌ $7,000/año", tira: "❌ $7,000/año" },
                        { f: "Employer matching disponible", iul: "❌ No aplica", k: "✅ Si disponible", roth: "❌ No", tira: "❌ No" },
                        { f: "Disponible con ITIN (sin SSN)", iul: "✅ Sí", k: "❌ Requiere SSN", roth: "❌ Requiere SSN", tira: "❌ Requiere SSN" },
                        { f: "Restricción por nivel de ingresos", iul: "❌ No tiene", k: "❌ No tiene", roth: "✅ Límite de ingresos", tira: "⚠️ Deducción limitada" },
                        { f: "Required Minimum Distributions", iul: "❌ Sin RMD", k: "✅ RMD desde los 73", roth: "❌ Sin RMD", tira: "✅ RMD desde los 73" },
                        { f: "Riders por enfermedad grave", iul: "✅ Disponibles", k: "❌ No", roth: "❌ No", tira: "❌ No" },
                        { f: "Vinculado a tu empleo", iul: "❌ Contrato personal", k: "✅ Atado al empleador", roth: "❌ No", tira: "❌ No" },
                      ].map((row, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-4 text-sm ${t.text} font-medium`}>{row.f}</td>
                          <td className="p-4 text-sm text-center font-semibold text-[#1d9fa9]">{row.iul}</td>
                          <td className={`p-4 text-sm text-center ${t.textMuted}`}>{row.k}</td>
                          <td className={`p-4 text-sm text-center ${t.textMuted}`}>{row.roth}</td>
                          <td className={`p-4 text-sm text-center ${t.textMuted}`}>{row.tira}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-[11px] ${t.textMuted} italic mt-4`}>
                  *Los préstamos sobre valor en efectivo pueden ser libres de impuestos cuando la póliza está correctamente estructurada bajo la Sec. 7702 y permanece activa. Consulta con tu asesor fiscal y de seguros licenciado.
                </p>
              </Anim>
            </div>
          </section>

          {/* CUÁNDO USAR CADA UNO */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Cuándo conviene <span className="italic text-[#1d9fa9]">cada instrumento</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "El 401(k) conviene cuando…",
                    color: "text-blue-500",
                    border: "border-blue-500/20",
                    items: [
                      "Tu empleador ofrece matching — es dinero gratuito inmediato",
                      "Tienes empleo W-2 estable con SSN",
                      "Quieres reducir tu base imponible este año fiscal",
                      "Priorizas el máximo upside de mercado a largo plazo",
                    ],
                  },
                  {
                    title: "El IUL conviene cuando…",
                    color: "text-[#1d9fa9]",
                    border: "border-[#1d9fa9]/40",
                    items: [
                      "Eres 1099, freelance o no tienes acceso a 401k",
                      "Tienes ITIN o Pasaporte — sin Seguro Social",
                      "Necesitas protección familiar integrada al ahorro",
                      "Quieres acceder al dinero antes de los 59½ sin penalidad",
                      "Quieres protección contra caídas del mercado",
                    ],
                  },
                  {
                    title: "La estrategia combinada cuando…",
                    color: "text-purple-500",
                    border: "border-purple-500/20",
                    items: [
                      "Tienes 401k con employer matching Y quieres más flexibilidad",
                      "Ya maximizas el 401k y quieres seguir ahorrando sin límites",
                      "Buscas diversificar fuentes de retiro y reducir riesgo fiscal",
                      "Quieres protección familiar que el 401k no ofrece",
                    ],
                  },
                ].map((col, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border ${col.border} rounded-2xl p-7 h-full backdrop-blur-xl`}>
                      <h3 className={`text-lg font-semibold ${col.color} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>{col.title}</h3>
                      <ul className="space-y-3">
                        {col.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckIcon className={`${col.color} shrink-0 mt-0.5`} />
                            <span className={`text-sm ${t.textMid}`}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* ESCENARIOS REALES */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Escenarios <span className="italic text-[#1d9fa9]">reales</span>
                </h2>
              </Anim>
              <div className="space-y-5">
                {[
                  {
                    name: "Roberto, 35, camionero 1099 en Miami",
                    scenario: "Sin acceso a 401k ni empleador. El IUL es su única opción de retiro formal con protección familiar incluida. Con $300/mes inicia la acumulación y tiene cobertura desde el día uno.",
                    tag: "Solo IUL",
                    tagColor: "text-[#1d9fa9] bg-[#1d9fa9]/10 border-[#1d9fa9]/20",
                  },
                  {
                    name: "Laura, 28, asistente dental W-2 en Doral",
                    scenario: "Su empleador ofrece 401k con 3% matching. Aprovecha el matching ($200/mes) para no dejar dinero en la mesa, y abre un IUL ($200/mes) para protección familiar y flexibilidad de acceso antes de los 65.",
                    tag: "401k hasta el matching + IUL",
                    tagColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
                  },
                  {
                    name: "Miguel, 42, dueño de taquería con ITIN en Hialeah",
                    scenario: "No puede abrir 401k ni Roth IRA. El IUL bajo la Sec. 7702 es el único instrumento de retiro formal al que tiene acceso con ITIN. Empieza con $250/mes para construir su jubilación privada.",
                    tag: "Solo IUL con ITIN",
                    tagColor: "text-[#1d9fa9] bg-[#1d9fa9]/10 border-[#1d9fa9]/20",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                        <h3 className={`text-lg font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
                        <span className={`text-xs font-bold tracking-widest uppercase ${item.tagColor} border rounded-full px-3 py-1 shrink-0`}>{item.tag}</span>
                      </div>
                      <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.scenario}</p>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim delay={0.3}>
                <div className="mt-10 text-center flex flex-wrap justify-center gap-4">
                  <Link to="/seguro-de-vida-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← ¿Qué es el IUL?</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">¿Tienes ITIN? Ver tu acceso →</Link>
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">IUL para protección y retiro →</Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* CTA */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Quieres ver tu comparación personalizada?
                </h2>
                <p className={`${t.textMid} mb-6 text-[15px]`}>
                  Un asesor licenciado de Platinium analiza tu situación específica — empleo, ITIN o SSN, meta de retiro — y te muestra qué instrumento o combinación hace más sentido para ti. Gratis y en español.
                </p>
                <Link
                  to="/cotizacion-iul"
                  className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-lg font-bold no-underline hover:shadow-lg transition-all"
                >
                  Solicita tu comparación personalizada →
                </Link>
                <p className={`text-xs ${t.textMuted} mt-3`}>Gratis · Sin compromiso · Asesoría en español</p>
              </Anim>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre <span className="italic text-[#1d9fa9]">IUL vs 401k y planes de retiro</span>
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

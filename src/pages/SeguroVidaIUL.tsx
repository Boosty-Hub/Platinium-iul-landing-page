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
  { q: "¿Qué es exactamente un IUL?", a: "IUL son las siglas de Indexed Universal Life — Seguro de Vida Universal Indexado. Es una póliza de vida permanente que combina una cobertura por fallecimiento con un componente de ahorro (valor en efectivo) que crece vinculado al rendimiento de índices como el S&P 500, con protección contra pérdidas mediante un piso del 0%." },
  { q: "¿Mi dinero se invierte directamente en la bolsa?", a: "No. Tu dinero no se invierte directamente en acciones. La aseguradora lo indexa al rendimiento del S&P 500: si el mercado sube, tú ganas hasta un tope (cap) establecido en el contrato. Si el mercado cae, tu saldo no retrocede — el piso del 0% lo protege." },
  { q: "¿Los retiros son realmente libres de impuestos?", a: "Bajo la Sección 7702 del Código Fiscal de EE.UU., los préstamos sobre el valor en efectivo pueden ser libres de impuestos, siempre que la póliza esté correctamente estructurada y permanezca activa. Si la póliza caduca antes de que se liquiden los préstamos, pueden generarse consecuencias fiscales. Tu asesor licenciado diseña la póliza para evitar ese escenario." },
  { q: "¿Pierdo el dinero si dejo de pagar la prima?", a: "No necesariamente. Si tienes suficiente valor en efectivo acumulado, la póliza puede sostenerse con ese fondo durante un período. Sin embargo, si el valor en efectivo se agota sin aportes adicionales, la póliza podría caducar. Lo recomendable es mantener el plan activo con tu asesor." },
  { q: "¿Qué pasa si me regreso a mi país de origen?", a: "Tu póliza es un contrato legal en EE.UU. que permanece vigente independientemente de tu país de residencia, siempre que mantengas los pagos activos. Tus beneficiarios pueden cobrar el beneficio desde cualquier país." },
  { q: "¿Necesito examen médico para aplicar?", a: "Depende de la aseguradora y del monto de cobertura solicitado. Algunos productos ofrecen aprobación simplificada sin examen físico completo para montos específicos. Un asesor te orienta sobre las opciones disponibles según tu perfil." },
  { q: "¿Puedo aplicar con ITIN o Pasaporte?", a: "Sí. El IUL está disponible para personas con SSN, ITIN o pasaporte vigente que cumplan los requisitos de la aseguradora. Tu estatus migratorio no impide el acceso bajo la Sección 7702 del Código Fiscal de EE.UU." },
  { q: "¿Qué diferencia hay entre el IUL y un Term Life?", a: "El Term Life cubre solo por fallecimiento durante un plazo fijo (10, 20 o 30 años) y no genera valor en efectivo. Al terminar el plazo, la cobertura desaparece. El IUL es permanente, no expira mientras se mantenga activo, y acumula un fondo que puedes usar en vida para retiro, emergencias o educación de tus hijos." },
];

export default function SeguroVidaIUL() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Qué es un IUL: Seguro de Vida Indexado en Español | Platinium"
            description="Guía completa del IUL: cómo funciona el piso del 0%, retiros bajo la Sec. 7702, quién accede con ITIN o pasaporte, y rangos de aportación. Cotiza gratis."
            keywords="qué es un IUL, seguro de vida universal indexado, cómo funciona un IUL, IUL Sección 7702, IUL en español, qué significa IUL, seguro indexado USA, IUL con ITIN, IUL con pasaporte, piso del 0% IUL"
            canonical={`${DOMAIN}/seguro-de-vida-iul`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "FinancialProduct",
                name: "Seguro de Vida Universal Indexado (IUL)",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "IUL: seguro de vida permanente con valor en efectivo indexado al S&P 500 y piso del 0%. Accesible con SSN, ITIN o pasaporte bajo la Sección 7702.",
                areaServed: { "@type": "State", name: "Florida" },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL" }]} t={t} />

          {/* HERO — 2 columnas: contenido + formulario */}
          <section className="pt-8 pb-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Columna izquierda */}
                <Anim>
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-6`}>
                    <span className="w-2 h-2 rounded-full bg-[#1d9fa9]" />
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">Guía Completa · IUL en Español</span>
                  </div>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.08] mb-5 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    ¿Qué es un IUL? El instrumento que protege tus ahorros{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      del IRS y de las caídas de la bolsa
                    </span>
                  </h1>
                  <p className={`text-base lg:text-lg ${t.textMid} leading-relaxed mb-7`}>
                    Un IUL (Indexed Universal Life) es un seguro de vida permanente que acumula dinero en efectivo indexado al S&P 500 con <strong className={t.text}>piso del 0%</strong> — si el mercado cae, tu saldo no pierde. Los retiros se estructuran libres de impuestos bajo la <strong className="text-[#1d9fa9]">Sección 7702</strong>. Aplica con SSN, ITIN o Pasaporte, desde $100 hasta $800 al mes.
                  </p>
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "📊", text: "Crece vinculado al S&P 500 — participas de las subidas, no de las bajadas" },
                      { icon: "🛡️", text: "Piso del 0%: si el mercado cae, tu saldo se congela, no retrocede" },
                      { icon: "💸", text: "Retiros estructurados libres de impuestos bajo la Sec. 7702 del IRS" },
                      { icon: "🌎", text: "Legal con ITIN o Pasaporte — sin necesitar Seguro Social" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                        <span className={`text-sm ${t.textMid} leading-relaxed`}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`text-xs ${t.textMuted} italic`}>
                    Asesoría gratuita en español · Sin compromiso · Licenciados en USA
                  </div>
                </Anim>

                {/* Columna derecha — Formulario */}
                <Anim delay={0.15}>
                  <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" inline cardTitle="Cotiza tu plan IUL de vida — gratis" />
                </Anim>
              </div>
            </div>
          </section>

          {/* BANNER CTA */}
          <section className="px-6 pb-6">
            <ContactBar t={t} compact />
          </section>

          {/* BLOQUE 3 PILARES */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Cómo funciona</p>
                  <h2 className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    El IUL opera con una <span className="italic text-[#1d9fa9]">regla matemática asimétrica</span>
                  </h2>
                  <p className={`mt-4 text-[15px] ${t.textMid} max-w-2xl mx-auto`}>
                    A diferencia de un 401k o un fondo de inversión, el IUL aplica la fórmula <code className="text-[#1d9fa9] font-mono text-sm">R = máx(0%, mín(R_mercado, Cap))</code> — capturas la subida hasta el tope, pero nunca participas de las caídas.
                  </p>
                </div>
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden rounded-2xl border border-[#1d9fa9]/20">
                {[
                  {
                    step: "01",
                    icon: "💳",
                    title: "Aportas capital",
                    desc: "Cada prima mensual se divide en dos: una porción cubre el costo del seguro de vida y el excedente entra a tu fondo de valor en efectivo (Cash Value), donde actúa el interés compuesto.",
                    detail: "Desde $100 hasta $800/mes según tu capacidad",
                  },
                  {
                    step: "02",
                    icon: "🛡️",
                    title: "El piso protege tu saldo",
                    desc: "Si el mercado cae un -25%, tu rendimiento ese año es del 0% — no retrocedes. Las ganancias de años anteriores quedan consolidadas. Si el mercado sube un 10%, ganas hasta el cap del contrato.",
                    detail: "Piso: 0% · Cap típico: 9% – 12%",
                  },
                  {
                    step: "03",
                    icon: "💸",
                    title: "Retiras sin impuestos",
                    desc: "Bajo la Sección 7702 del Código Fiscal de EE.UU., los préstamos sobre el valor en efectivo no califican como ingreso gravable, siempre que la póliza permanezca activa y esté bien diseñada.",
                    detail: "Sin penalidades por edad, sin RMD",
                  },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} p-8 h-full ${i < 2 ? `border-r border-[#1d9fa9]/10` : ""}`}>
                      <div className="text-xs text-[#1d9fa9] font-bold tracking-widest uppercase mb-3">{item.step}</div>
                      <span className="text-3xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed mb-4`}>{item.desc}</p>
                      <div className={`text-xs font-bold text-[#1d9fa9] bg-[#1d9fa9]/10 rounded-lg px-3 py-2 border border-[#1d9fa9]/20`}>{item.detail}</div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* COMPONENTES DE LA PÓLIZA */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Los cuatro componentes de <span className="italic text-[#1d9fa9]">tu póliza IUL</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-xl mx-auto mb-10 text-[15px]`}>
                  A diferencia del Term Life que solo paga si falleces, el IUL tiene cuatro partes que trabajan simultáneamente desde el primer mes.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Beneficio por fallecimiento", desc: "Pago garantizado a tus beneficiarios libre de impuestos federales. Cubre hipoteca, deudas, gastos de educación y el nivel de vida de tu familia. No expira como el Term Life.", icon: "🏠" },
                  { title: "Valor en efectivo (Cash Value)", desc: "El motor de acumulación. Crece con interés compuesto indexado al S&P 500. Es accesible mediante préstamos de la póliza en vida, para retiro, emergencias o educación de tus hijos.", icon: "💰" },
                  { title: "Prima flexible", desc: "Tú decides cuánto aportas cada mes dentro del rango del contrato. Puedes aumentar o reducir según tu situación sin perder la póliza, siempre que el diseño lo permita.", icon: "🔧" },
                  { title: "Riders de enfermedades graves", desc: "Beneficios en vida para enfermedades crónicas, críticas y terminales. Si te diagnostican cáncer, infarto u otra condición cubierta, puedes adelantar parte del beneficio sin haber fallecido.", icon: "❤️", link: { to: "/beneficios-en-vida", label: "Ver beneficios en vida →" } },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <div className="flex items-start gap-4">
                        <span className="text-3xl shrink-0">{item.icon}</span>
                        <div>
                          <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                          <p className={`text-sm ${t.textMuted} leading-relaxed mb-2`}>{item.desc}</p>
                          {item.link && (
                            <Link to={item.link.to} className="text-[#1d9fa9] text-sm font-semibold hover:underline">{item.link.label}</Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* PARA QUÉ SIRVE EN VIDA */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Para qué sirve un IUL <span className="italic text-[#1d9fa9]">mientras vives</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  No es solo un seguro de muerte. El valor en efectivo acumulado es un fondo líquido con múltiples usos en vida — sin las restricciones de edad ni las penalidades del 401k.
                </p>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { icon: "🏖️", title: "Jubilación privada", desc: "Accede al valor acumulado como retiro complementario, sin penalidades y sin RMD.", link: { to: "/proteccion-familiar", label: "Ver retiro →" } },
                  { icon: "🚨", title: "Emergencias médicas", desc: "Los riders de enfermedades graves activan el beneficio si te diagnostican una condición cubierta.", link: { to: "/beneficios-en-vida", label: "Ver riders →" } },
                  { icon: "🎓", title: "Educación de los hijos", desc: "El valor acumulado puede usarse para la universidad u otras metas del hijo cuando sea adulto.", link: { to: "/iul-para-hijos", label: "Ver plan hijos →" } },
                  { icon: "🏠", title: "Legado sin impuestos", desc: "El beneficio por fallecimiento se entrega libre de impuestos federales a quien tú designes." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-2xl p-6 backdrop-blur-xl h-full`}>
                      <span className="text-3xl mb-3 block">{item.icon}</span>
                      <h3 className={`text-base font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed mb-3`}>{item.desc}</p>
                      {item.link && (
                        <Link to={item.link.to} className="text-[#1d9fa9] text-xs font-semibold hover:underline">{item.link.label}</Link>
                      )}
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* QUIÉN PUEDE ACCEDER */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Quién puede <span className="italic text-[#1d9fa9]">acceder a un IUL en EE.UU.?</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: "🪪", title: "Con Seguro Social (SSN)", desc: "Ciudadanos, residentes permanentes y trabajadores con SSN. Acceso directo y sin fricción." },
                  { icon: "📄", title: "Con ITIN (Tax ID)", desc: "El ITIN del IRS es identificación válida bajo la Sec. 7702. Necesitas haber declarado impuestos." },
                  { icon: "🛂", title: "Con Pasaporte vigente", desc: "Pasaporte de tu país de origen combinado con comprobante de domicilio en EE.UU." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 text-center backdrop-blur-xl`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.2}>
                <p className={`text-center text-sm ${t.textMid}`}>
                  ¿Tienes dudas sobre el acceso con ITIN o Pasaporte?{" "}
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold hover:underline">
                    Lee la guía completa de acceso sin SSN →
                  </Link>
                </p>
              </Anim>
            </div>
          </section>

          {/* RANGOS DE APORTACIÓN */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} text-center mb-8`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Rangos de aportación <span className="italic text-[#1d9fa9]">realistas</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { range: "$100 – $150", label: "Plan Esencial", sub: "Inicio o complemento" },
                  { range: "$150 – $400", label: "Plan Optimizado", sub: "Recomendado ✦", highlight: true },
                  { range: "$400 – $800", label: "Plan Acelerado", sub: "Dueños de negocio" },
                  { range: "$800+", label: "Plan Premium", sub: "Estructura corporativa" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.07}>
                    <div className={`${t.card} border rounded-xl p-5 text-center ${item.highlight ? "border-[#1d9fa9]" : ""}`}>
                      <div className="text-[#1d9fa9] font-bold text-lg mb-1">{item.range}</div>
                      <div className={`text-xs font-bold ${t.text} uppercase tracking-wide mb-1`}>{item.label}</div>
                      <div className={`text-xs ${t.textMuted}`}>{item.sub}</div>
                    </div>
                  </Anim>
                ))}
              </div>
              <Anim delay={0.25}>
                <div className={`${t.card} border border-dashed border-[#1d9fa9]/50 rounded-xl p-4 mt-2 text-center`}>
                  <div className="text-[#1d9fa9] font-bold text-lg mb-1">Personalizado</div>
                  <div className={`text-xs font-bold ${t.text} uppercase tracking-wide mb-1`}>A tu medida</div>
                  <div className={`text-xs ${t.textMuted}`}>Para objetivos específicos — el asesor diseña el monto exacto según tu perfil</div>
                </div>
              </Anim>
              <Anim delay={0.3}>
                <p className={`text-[11px] ${t.textMuted} italic mt-4 text-center`}>
                  Rangos orientativos. El diseño exacto lo calcula un asesor licenciado según tu perfil, edad y meta.
                </p>
              </Anim>
            </div>
          </section>

          {/* DIFERENCIAS CLAVE */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cómo se diferencia de otros <span className="italic text-[#1d9fa9]">instrumentos</span>
                </h2>
                <p className={`text-center ${t.textMid} max-w-2xl mx-auto mb-10 text-[15px]`}>
                  El IUL no reemplaza al 401k en todos los casos. La diferencia clave es que ningún otro instrumento individual combina protección permanente + acumulación indexada + protección contra pérdidas + acceso sin penalidad.
                </p>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: "IUL vs Term Life", diff: "El Term Life cubre solo durante un plazo y no acumula nada al vencer. El IUL es permanente y genera valor en efectivo que puedes usar en vida." },
                  { title: "IUL vs 401(k)", diff: "El 401k no incluye seguro de vida ni piso contra pérdidas. Tiene límites de contribución y penalidades por retiro anticipado. No acepta ITIN.", link: { to: "/iul-vs-401k", label: "Comparativa completa →" } },
                  { title: "IUL vs Cuenta bancaria", diff: "Un banco no ofrece protección por fallecimiento ni crecimiento indexado. El interés bancario rara vez supera la inflación. Sin beneficios en vida." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <h3 className={`text-base font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed mb-3`}>{item.diff}</p>
                      {item.link && (
                        <Link to={item.link.to} className="text-[#1d9fa9] text-sm font-semibold hover:underline">{item.link.label}</Link>
                      )}
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* CTA INTERMEDIO */}
          <section className={`${t.bg2} py-16 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-2xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Listo para ver cuánto puedes acumular con un IUL?
                </h2>
                <p className={`${t.textMid} mb-6 text-[15px]`}>
                  Un asesor licenciado de Platinium calcula tu proyección personalizada en PDF — números reales según tu edad, salud y aportación estimada. Gratis y sin compromiso.
                </p>
                <Link
                  to="/cotizacion-iul"
                  className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-lg font-bold no-underline hover:shadow-lg transition-all"
                >
                  Recibe tu cotización personalizada en PDF →
                </Link>
                <p className={`text-xs ${t.textMuted} mt-3`}>Aplica con SSN, ITIN o Pasaporte · En español · Sin compromiso</p>
              </Anim>
            </div>
          </section>

          {/* EXPLORA SEGÚN TU SITUACIÓN */}
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Explora el IUL según <span className="italic text-[#1d9fa9]">tu situación</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { title: "Protección y Retiro", desc: "Protege a tu familia y construye tu jubilación privada con un solo plan.", href: "/proteccion-familiar", icon: "🏠" },
                  { title: "Seguro con ITIN", desc: "Aplica sin SSN. Solo necesitas ITIN o pasaporte vigente.", href: "/seguro-vida-itin", icon: "🌎" },
                  { title: "IUL vs 401(k)", desc: "Compara ventajas fiscales, acceso anticipado y protección contra caídas.", href: "/iul-vs-401k", icon: "⚖️" },
                  { title: "Para Emprendedores", desc: "Ideal para dueños de negocio, contratistas 1099 y self-employed.", href: "/iul-emprendedores", icon: "💼" },
                  { title: "Plan para Hijos", desc: "El tiempo compuesto empieza cuanto antes. Asegura el futuro de tus hijos hoy.", href: "/iul-para-hijos", icon: "👶" },
                  { title: "Beneficios en Vida", desc: "Usa tu seguro si te enfermas gravemente, no solo cuando falleces.", href: "/beneficios-en-vida", icon: "❤️" },
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
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre el <span className="italic text-[#1d9fa9]">IUL</span>
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

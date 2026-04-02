import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { FAQS, FULL_COMPARISON } from "@/components/shared/data";

const PAGE_FAQS = FAQS; // Use all FAQs on the pillar page

export default function SeguroVidaIUL() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro de Vida Universal Indexado (IUL) Explicado en Español"
            description="Guía completa del IUL: cómo funciona, beneficios, costos y para quién es ideal. Información clara en español para hispanos en EE.UU."
            keywords="seguro de vida universal indexado, seguro de vida IUL, IUL en español, qué es un IUL, cómo funciona el IUL, IUL para hispanos, seguro de vida que genera dinero, póliza de vida con valor en efectivo, seguro de vida permanente hispanos Florida, seguro de vida que crece con el mercado Miami"
            canonical={`${DOMAIN}/seguro-de-vida-iul`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "Article",
                headline: "¿Qué es un Seguro de Vida Universal Indexado (IUL)?",
                description: "Guía completa del IUL para hispanos en EE.UU.",
                author: { "@type": "Organization", name: "Platinium Insurance Group" },
                publisher: { "@type": "Organization", name: "Platinium Insurance Group", logo: { "@type": "ImageObject", url: `${DOMAIN}/logo.png` } },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: PAGE_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                ],
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="w-2 h-2 rounded-full bg-[#1d9fa9]" />
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">Guía Completa</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl lg:text-[56px] font-normal leading-[1.08] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  ¿Qué es un Seguro de Vida{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    Universal Indexado (IUL)
                  </span>?
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  Es un seguro de vida permanente que combina <strong className={t.text}>protección por fallecimiento</strong> con un componente de <strong className="text-[#1d9fa9]">ahorro que crece vinculado al mercado</strong>, pero sin riesgo de pérdida. La herramienta financiera más completa para latinos en EE.UU.
                </p>
              </Anim>
            </div>
          </section>

          {/* CÓMO FUNCIONA EL INDEXING */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Mecanismo</p>
                  <h2 className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    ¿Cómo funciona el <span className="italic text-[#1d9fa9]">indexing</span>?
                  </h2>
                </div>
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "📊", title: "Vinculado al S&P 500", desc: "Tu valor en efectivo gana intereses basados en el rendimiento de índices como el S&P 500. No se invierte directamente en la bolsa." },
                  { icon: "🛡️", title: "Piso Garantizado 0%", desc: "Si el mercado cae, tu dinero no pierde valor. El piso protege tu capital acumulado. Solo ganas, nunca pierdes." },
                  { icon: "📈", title: "Cap de Rendimiento", desc: "Hay un techo (cap) típicamente entre 9.5% y 12%. Si el mercado sube 20%, ganas hasta el cap. A cambio, tienes protección total contra caídas." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-8 h-full backdrop-blur-xl`}>
                      <span className="text-4xl mb-4 block">{item.icon}</span>
                      <h3 className={`text-xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
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
                <div className="text-center mb-12">
                  <h2 className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Componentes de un <span className="italic text-[#1d9fa9]">IUL</span>
                  </h2>
                </div>
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Beneficio por Fallecimiento", desc: "Pago garantizado a tus beneficiarios, libre de impuestos. Protege hipoteca, deudas y nivel de vida de tu familia.", icon: "🏠" },
                  { title: "Valor en Efectivo", desc: "Componente de ahorro que crece con interés compuesto vinculado al mercado. Accesible mediante préstamos de la póliza sin penalidades.", icon: "💰" },
                  { title: "Prima Flexible", desc: "Tú decides cuánto aportas cada mes. Puedes aumentar o reducir según tu situación financiera.", icon: "🔧" },
                  { title: "Riders Opcionales", desc: "Beneficios adicionales como riders de enfermedad crónica, crítica y terminal. Accede a tu dinero cuando más lo necesitas.", icon: "❤️" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <div className="flex items-start gap-4">
                        <span className="text-3xl shrink-0">{item.icon}</span>
                        <div>
                          <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                          <p className={`text-sm ${t.textMuted} leading-relaxed`}>{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* FULL COMPARISON TABLE */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  IUL vs otras opciones: <span className="italic text-[#1d9fa9]">comparación completa</span>
                </h2>
              </Anim>
              <Anim delay={0.1}>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[560px] ${t.divider} border rounded-xl overflow-hidden`}>
                    <thead>
                      <tr className={t.brandBg}>
                        {["Característica", "IUL", "Banco", "401(k)", "Term Life"].map((h, i) => (
                          <th key={i} className={`p-3 text-[10px] tracking-[1.5px] uppercase font-bold ${i === 1 ? "text-[#1d9fa9]" : t.textMuted} ${i > 0 ? "text-center" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FULL_COMPARISON.map((r, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-3 text-sm ${t.text}`}>{r.f}</td>
                          {[r.iul, r.bank, r.k, r.term].map((v, j) => (
                            <td key={j} className="p-3 text-center">
                              {v ? <CheckIcon className={j === 0 ? "text-[#1d9fa9] mx-auto" : `${t.textMid} mx-auto`} /> : <span className={`${t.textMuted} opacity-30`}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-6">
                  <Link to="/iul-vs-401k" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Ver comparación detallada IUL vs 401(k) →</Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* INTERNAL LINKS */}
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Explora el IUL según <span className="italic text-[#1d9fa9]">tu situación</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { title: "Jubilación sin 401k", desc: "Sin 401k ni pensión? El IUL es tu plan de retiro en Miami.", href: "/jubilacion-sin-401k", icon: "📈" },
                  { title: "Seguro con ITIN", desc: "Aplica sin SSN. Solo necesitas ITIN y tax returns.", href: "/seguro-vida-itin", icon: "🌎" },
                  { title: "IUL vs 401(k)", desc: "Compara ventajas fiscales, acceso y protección.", href: "/iul-vs-401k", icon: "⚖️" },
                  { title: "Protección Familiar", desc: "Asegura el futuro de tu familia con cobertura permanente.", href: "/iul-proteccion-familiar", icon: "🏠" },
                  { title: "Para Emprendedores", desc: "Ideal para dueños de negocio y contratistas 1099 en Miami-Dade.", href: "/iul-emprendedores", icon: "💼" },
                  { title: "Beneficios en Vida", desc: "Usa tu seguro si te enfermas. No solo cuando mueras.", href: "/beneficios-en-vida", icon: "❤️" },
                  { title: "Consulta Gratuita", desc: "Agenda una sesión personalizada sin compromiso.", href: "/contacto", icon: "📞" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <Link to={item.href} className="no-underline block h-full">
                      <div className={`${t.card} border rounded-2xl p-6 h-full backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1d9fa9]/30`}>
                        <span className="text-3xl mb-3 block">{item.icon}</span>
                        <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                        <p className={`text-sm ${t.textMuted}`}>{item.desc}</p>
                        <span className="text-[#1d9fa9] text-sm font-semibold mt-3 block">Saber más →</span>
                      </div>
                    </Link>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className={`${t.bg2} py-20 px-6`} aria-labelledby="faq-pillar">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 id="faq-pillar" className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre el <span className="italic text-[#1d9fa9]">IUL</span>
                </h2>
              </Anim>
              <div className="space-y-3">
                {PAGE_FAQS.map((faq, i) => (
                  <Anim key={i} delay={i * 0.05}>
                    <div className={`${t.card} border rounded-xl overflow-hidden backdrop-blur-xl`}>
                      <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className={`w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer bg-transparent border-none ${t.text}`} aria-expanded={faqOpen === i}>
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

          <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" />
          <div className="px-6 pb-12"><ContactBar t={t} /></div>
        </>
      )}
    </Layout>
  );
}

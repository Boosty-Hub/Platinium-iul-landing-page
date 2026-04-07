import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Link } from "react-router-dom";

export default function IULParaJubilacion() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Jubilación para Hispanos sin 401k Miami | Seguro IUL | Platinium Insurance"
            description="¿Trabajas por tu cuenta o no tienes 401k? El IUL es tu alternativa para jubilarte con ingresos libres de impuestos. Asesoría en español en Miami. Cotiza gratis."
            keywords="ahorro para jubilación sin 401k, IUL vs 401k, plan de jubilación para hispanos, retiro sin 401k Miami, cómo jubilarme si no tengo 401k, cómo ahorrar para el retiro siendo inmigrante, alternativas al 401k para hispanos, plan de retiro para trabajadores independientes, jubilación para hispanos Estados Unidos, ingreso libre de impuestos jubilación, plan de retiro trabajador por cuenta propia Florida, 401k vs IUL diferencias"
            canonical={`${DOMAIN}/jubilacion-sin-401k`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "Jubilación sin 401k", item: `${DOMAIN}/jubilacion-sin-401k` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "Plan de Retiro con IUL",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Plan de retiro con IUL para hispanos sin acceso a 401k. Crecimiento indexado y acceso libre de impuestos.",
                areaServed: { "@type": "State", name: "Florida" },
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "Jubilación sin 401k" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">📈 Plan de Retiro</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Planifica tu jubilación en Miami{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    sin necesitar un 401(k)
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  Si eres contratista 1099, trabajador independiente o simplemente no tienes acceso a un 401(k) en Miami-Dade, el IUL es tu vehículo para construir un retiro digno con <strong className="text-[#1d9fa9]">crecimiento indexado y acceso libre de impuestos</strong>.
                </p>
              </Anim>
            </div>
          </section>

          {/* EL PROBLEMA */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  La realidad del trabajador <span className="italic text-red-500">sin 401(k)</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: "❌", text: "Sin employer matching — nadie duplica tus ahorros" },
                  { icon: "🏦", text: "El banco te paga 0.05% mientras la inflación sube 3-5% anual" },
                  { icon: "📉", text: "Sin plan formal, dependes de Social Security (que puede no ser suficiente)" },
                  { icon: "⏰", text: "Cada año que esperas, pierdes miles en interés compuesto" },
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

          {/* LA SOLUCIÓN */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  El IUL como tu <span className="italic text-[#1d9fa9]">plan de retiro personal</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Crecimiento Indexado", desc: "Tu dinero crece vinculado al S&P 500 con un piso de 0%. Ganas cuando el mercado sube, no pierdes cuando baja.", icon: "📊" },
                  { title: "Acceso sin Penalidades", desc: "A diferencia del 401(k), puedes acceder a tu dinero antes de los 59½ mediante préstamos de la póliza, sin penalidades del IRS.", icon: "🔓" },
                  { title: "Retiros Libres de Impuestos", desc: "Los préstamos de tu póliza son estratégicamente libres de impuestos cuando se estructuran correctamente.", icon: "💵" },
                  { title: "Protección Incluida", desc: "A diferencia de una cuenta de retiro, el IUL incluye un beneficio por fallecimiento que protege a tu familia.", icon: "🛡️" },
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

          {/* SIMULACIÓN */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Simulación de crecimiento: <span className="italic text-[#1d9fa9]">$250/mes</span>
                </h2>
                <p className={`text-sm ${t.textMuted} mb-10`}>Proyección ilustrativa con cap promedio de 10% y piso de 0%</p>
              </Anim>
              <Anim delay={0.1}>
                <div className="overflow-x-auto">
                  <table className={`w-full ${t.divider} border rounded-xl overflow-hidden`}>
                    <thead>
                      <tr className={t.brandBg}>
                        <th className={`p-4 text-left text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Inicio</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Años</th>
                        <th className="p-4 text-center text-[11px] tracking-[2px] text-[#1d9fa9] uppercase font-bold">Valor Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { age: "A los 25 años", years: "30 años", value: "$300,000+" },
                        { age: "A los 30 años", years: "25 años", value: "$200,000+" },
                        { age: "A los 35 años", years: "20 años", value: "$130,000+" },
                        { age: "A los 40 años", years: "15 años", value: "$75,000+" },
                        { age: "A los 45 años", years: "10 años", value: "$40,000+" },
                      ].map((row, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-4 text-sm ${t.text} font-medium`}>{row.age}</td>
                          <td className={`p-4 text-sm ${t.textMuted} text-center`}>{row.years}</td>
                          <td className="p-4 text-sm text-[#1d9fa9] text-center font-bold">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-[11px] ${t.textMuted} italic mt-4`}>*Valores ilustrativos. Resultados reales dependen del rendimiento del índice y la estructura de la póliza.</p>
              </Anim>
            </div>
          </section>

          {/* VENTAJAS FISCALES */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ventajas fiscales del <span className="italic text-[#1d9fa9]">IUL para retiro</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  "Crecimiento con impuestos diferidos (tax-deferred growth)",
                  "Préstamos de la póliza potencialmente libres de impuestos",
                  "Sin penalidades por retiro antes de los 59½ (a diferencia del 401k)",
                  "Beneficio por fallecimiento libre de impuestos para tus beneficiarios",
                  "Sin límites de contribución del IRS como en un 401(k) o IRA",
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
                  <Link to="/iul-vs-401k" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Compara IUL vs 401(k) →</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">¿Tienes ITIN? Aplica aquí →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" />
          
        </>
      )}
    </Layout>
  );
}

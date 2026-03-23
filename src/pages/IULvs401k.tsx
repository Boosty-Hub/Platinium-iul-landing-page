import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";

export default function IULvs401k() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="IUL vs 401k para Hispanos | Comparativa Completa | Platinium Insurance Miami"
            description="¿Qué conviene más: un IUL o un 401k? Te explicamos las diferencias en español para que decidas según tu situación en Miami. Sin letras pequeñas."
            keywords="IUL vs 401k, diferencias IUL y 401k, qué es mejor IUL o 401k, iul o 401k cuál conviene más, diferencia entre 401k y seguro de vida, puedo tener IUL y 401k al mismo tiempo, ventajas del IUL sobre el 401k, IUL vs Roth IRA, penalidades del 401k para hispanos, retiro libre de impuestos IUL, mejor plan de retiro hispanos Miami"
            canonical={`${DOMAIN}/iul-vs-401k`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "IUL vs 401(k)", item: `${DOMAIN}/iul-vs-401k` },
                ],
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL vs 401(k)" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">⚖️ Comparativa</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  IUL vs 401(k):{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    ¿cuál es mejor para los hispanos en Miami?
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  Ambos son herramientas de retiro, pero funcionan de manera muy diferente. Aquí te explicamos las diferencias reales para que tomes la mejor decisión según tu situación.
                </p>
              </Anim>
            </div>
          </section>

          {/* TABLA COMPARATIVA PRINCIPAL */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Comparación <span className="italic text-[#1d9fa9]">detallada</span>
                </h2>
              </Anim>
              <Anim delay={0.1}>
                <div className="overflow-x-auto">
                  <table className={`w-full min-w-[700px] ${t.divider} border rounded-xl overflow-hidden`}>
                    <thead>
                      <tr className={t.brandBg}>
                        <th className={`p-4 text-left text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Característica</th>
                        <th className="p-4 text-center text-[11px] tracking-[2px] text-[#1d9fa9] uppercase font-bold">IUL</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>401(k)</th>
                        <th className={`p-4 text-center text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Roth IRA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { f: "Protección por fallecimiento", iul: "✅ Sí, incluida", k: "❌ No", roth: "❌ No" },
                        { f: "Crecimiento vinculado al mercado", iul: "✅ S&P 500", k: "✅ Fondos mutuos", roth: "✅ Fondos mutuos" },
                        { f: "Protección contra pérdidas (piso 0%)", iul: "✅ Garantizado", k: "❌ Riesgo total", roth: "❌ Riesgo total" },
                        { f: "Acceso antes de 59½ sin penalidad", iul: "✅ Préstamos", k: "❌ 10% penalidad", roth: "⚠️ Solo contribuciones" },
                        { f: "Retiros libres de impuestos", iul: "✅ Préstamos*", k: "❌ Gravables", roth: "✅ Después de 59½" },
                        { f: "Límites de contribución IRS", iul: "✅ Sin límite", k: "❌ $23,000/año", roth: "❌ $7,000/año" },
                        { f: "Employer matching", iul: "❌ No aplica", k: "✅ Si disponible", roth: "❌ No aplica" },
                        { f: "Riders enfermedades graves", iul: "✅ Disponibles", k: "❌ No", roth: "❌ No" },
                        { f: "Aplicable con ITIN", iul: "✅ Sí", k: "❌ Necesita SSN", roth: "❌ Necesita SSN" },
                        { f: "Required Minimum Distributions", iul: "✅ No tiene RMD", k: "❌ A los 73", roth: "✅ No tiene RMD" },
                      ].map((row, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-4 text-sm ${t.text} font-medium`}>{row.f}</td>
                          <td className="p-4 text-sm text-center font-medium">{row.iul}</td>
                          <td className={`p-4 text-sm text-center ${t.textMuted}`}>{row.k}</td>
                          <td className={`p-4 text-sm text-center ${t.textMuted}`}>{row.roth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-[11px] ${t.textMuted} italic mt-4`}>*Préstamos de la póliza pueden ser libres de impuestos cuando se estructuran correctamente. Consulte con su asesor fiscal.</p>
              </Anim>
            </div>
          </section>

          {/* CUÁNDO USAR CADA UNO */}
          <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Cuándo usar <span className="italic text-[#1d9fa9]">cada uno</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Usa el 401(k) cuando...",
                    color: "text-blue-500",
                    items: ["Tu empleador ofrece matching (dinero gratis)", "Quieres reducir tu base imponible este año", "Tienes SSN y empleo W-2 estable"],
                  },
                  {
                    title: "Usa el IUL cuando...",
                    color: "text-[#1d9fa9]",
                    items: ["Eres 1099 o no tienes acceso a 401(k)", "Quieres protección familiar + retiro", "Tienes ITIN (sin SSN)", "Necesitas acceso a tu dinero antes de 59½", "Quieres protección contra caídas del mercado"],
                  },
                  {
                    title: "Combínalos cuando...",
                    color: "text-purple-500",
                    items: ["Tienes 401(k) con matching Y quieres protección extra", "Quieres diversificar tus fuentes de retiro", "Buscas flexibilidad fiscal en el retiro"],
                  },
                ].map((col, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 h-full backdrop-blur-xl`}>
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
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Escenarios <span className="italic text-[#1d9fa9]">reales</span>
                </h2>
              </Anim>
              <div className="space-y-5">
                {[
                  { name: "Roberto, 35, camionero 1099", scenario: "Sin acceso a 401(k). Con $300/mes en un IUL puede acumular ~$180,000 para los 60 + $500,000 de protección por fallecimiento para su familia.", result: "IUL es la mejor opción" },
                  { name: "Laura, 28, asistente dental W-2", scenario: "Su empleador ofrece 401(k) con 3% matching. Debe aprovechar el matching primero ($200/mes) y luego abrir un IUL ($200/mes) para protección y flexibilidad.", result: "Combinar ambos" },
                  { name: "Miguel, 42, dueño de taquería, ITIN", scenario: "No puede abrir 401(k) ni Roth IRA. El IUL es su única opción formal de retiro con protección incluida. Empieza con $250/mes.", result: "IUL es la única opción" },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.1}>
                    <div className={`${t.card} border rounded-2xl p-7 backdrop-blur-xl`}>
                      <h3 className={`text-lg font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</h3>
                      <p className={`text-sm ${t.textMid} leading-relaxed mb-3`}>{item.scenario}</p>
                      <div className="inline-flex items-center gap-2 bg-[#1d9fa9]/10 border border-[#1d9fa9]/20 rounded-lg px-4 py-2">
                        <CheckIcon className="text-[#1d9fa9]" />
                        <span className="text-sm text-[#1d9fa9] font-semibold">{item.result}</span>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>

              <Anim delay={0.3}>
                <div className="mt-10 text-center flex flex-wrap justify-center gap-4">
                  <Link to="/jubilacion-sin-401k" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← Jubilación sin 401k</Link>
                  <Link to="/seguro-de-vida-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">¿Qué es el IUL? →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Ahorro a largo plazo / retiro" />
          <div className="px-6 pb-12"><ContactBar t={t} /></div>
        </>
      )}
    </Layout>
  );
}

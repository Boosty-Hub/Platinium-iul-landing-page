import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CheckIcon } from "@/components/shared/Icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { Link } from "react-router-dom";

export default function IULEmprendedores() {
  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro IUL para Emprendedores y Contratistas 1099 | Miami"
            description="Sin beneficios de empleador, sin 401k. El IUL es tu solución: protección, ahorro y plan de retiro para dueños de negocio y trabajadores 1099 en Miami."
            keywords="seguro de vida para dueños de negocio, plan de retiro self-employed hispano, seguro IUL emprendedores Miami, cómo ahorrar para el retiro siendo self-employed, plan de jubilación para dueño de negocio hispano, seguro de vida para contratistas independientes, plan financiero para inmigrante con negocio, beneficios del IUL para negocio propio, seguro de vida para restaurantero hispano Miami, IUL para trabajadores de construcción, seguro de vida contratistas 1099 Doral Hialeah"
            canonical={`${DOMAIN}/iul-emprendedores`}
            jsonLd={[
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Inicio", item: DOMAIN },
                  { "@type": "ListItem", position: 2, name: "Seguro de Vida IUL", item: `${DOMAIN}/seguro-de-vida-iul` },
                  { "@type": "ListItem", position: 3, name: "IUL para Emprendedores", item: `${DOMAIN}/iul-emprendedores` },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                name: "IUL para Emprendedores y Contratistas 1099",
                provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
                description: "Plan de retiro y protección para emprendedores hispanos, contratistas 1099 y dueños de negocio en Miami sin acceso a 401k.",
                areaServed: { "@type": "State", name: "Florida" },
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL para Emprendedores" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">💼 Para Emprendedores</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  El plan financiero para hispanos que{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    trabajan por su cuenta
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  Si eres dueño de negocio, contratista 1099 o self-employed en Miami, nadie te ofrece 401(k) ni beneficios. El IUL es tu <strong className="text-[#1d9fa9]">plan de retiro, protección y ahorro</strong> — todo en uno.
                </p>
              </Anim>
            </div>
          </section>

          {/* LA REALIDAD DEL 1099 */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  La realidad del trabajador <span className="italic text-red-500">independiente</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: "❌", text: "Sin 401(k), sin employer matching, sin beneficios de salud" },
                  { icon: "💸", text: "Pagas más impuestos (self-employment tax del 15.3%)" },
                  { icon: "🤕", text: "Si te enfermas o te accidentas, no hay ingreso por incapacidad" },
                  { icon: "⏰", text: "Trabajas 60+ horas pero no tienes plan de retiro formal" },
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

          {/* IUL COMO BENEFICIO PROPIO */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  El IUL como tu <span className="italic text-[#1d9fa9]">"beneficio de empleador" propio</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Plan de Retiro Personal", desc: "Sin límites del IRS. Contribuye lo que puedas, cuando puedas. Tu retiro no depende de un empleador.", icon: "📈" },
                  { title: "Protección del Negocio", desc: "Si algo te pasa, tu familia recibe un beneficio que cubre deudas del negocio, equipo y capital de trabajo.", icon: "🏢" },
                  { title: "Liquidez para Emergencias", desc: "Accede al valor acumulado de tu póliza cuando necesites capital para tu negocio, sin bancos ni préstamos.", icon: "💵" },
                  { title: "Sucesión Patrimonial", desc: "Planifica la transferencia de tu negocio y patrimonio a la siguiente generación, libre de impuestos.", icon: "🤝" },
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

          {/* PERFILES */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ideal para emprendedores en <span className="italic text-[#1d9fa9]">Miami-Dade</span>
                </h2>
              </Anim>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: "🍽️", title: "Restaurantes", desc: "Dueños de restaurantes, food trucks y catering en Hialeah y Doral." },
                  { icon: "🔨", title: "Construcción", desc: "Contratistas, pintores, plomeros y electricistas independientes." },
                  { icon: "🚛", title: "Transporte", desc: "Camioneros, choferes de delivery y conductores 1099." },
                  { icon: "🧹", title: "Limpieza", desc: "Empresas de cleaning, mantenimiento y servicios domésticos." },
                  { icon: "💇", title: "Belleza y Salud", desc: "Estilistas, barberos y profesionales de belleza independientes." },
                  { icon: "🏪", title: "Comercio", desc: "Dueños de tiendas, importadores y comerciantes en Miami." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-5 text-center backdrop-blur-xl`}>
                      <span className="text-3xl mb-2 block">{item.icon}</span>
                      <h3 className={`text-base font-semibold ${t.text} mb-1`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                      <p className={`text-xs ${t.textMuted}`}>{item.desc}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* VENTAJAS */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ventajas del IUL para <span className="italic text-[#1d9fa9]">tu negocio</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  "Sin límites de contribución del IRS (a diferencia del SEP-IRA o Solo 401k)",
                  "Crecimiento con impuestos diferidos — más dinero trabajando para ti",
                  "Acceso a tu capital sin penalidades ni aprobación bancaria",
                  "Protección contra demandas (en muchos estados el valor en póliza es protegido)",
                  "Beneficio por fallecimiento que protege a tu familia Y tu negocio",
                  "Aplicable con ITIN — ideal para emprendedores inmigrantes en South Florida",
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
                  <Link to="/proteccion-familiar" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← Retiro privado con IUL</Link>
                  <Link to="/seguro-vida-itin" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">¿Tienes ITIN? →</Link>
                  <Link to="/cotizacion-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">Cotiza tu plan →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Proteger mi negocio" />
          
        </>
      )}
    </Layout>
  );
}

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
  { q: "¿Necesito Seguro Social para aplicar?", a: "No. Puedes aplicar con ITIN (Individual Taxpayer Identification Number), pasaporte o matrícula consular. El requisito principal es haber declarado impuestos en EE.UU." },
  { q: "¿Es legal tener un seguro de vida con ITIN?", a: "Sí, completamente legal. El ITIN fue creado por el IRS para que personas sin SSN puedan cumplir con sus obligaciones tributarias y acceder a servicios financieros." },
  { q: "¿Pueden cancelar mi póliza si mi estatus migratorio cambia?", a: "No. Una vez aprobada, tu póliza es un contrato legal vigente independientemente de cambios en tu estatus migratorio." },
  { q: "¿Mi información es confidencial?", a: "Absolutamente. Las aseguradoras están reguladas por leyes estatales y federales de privacidad. Tu información no se comparte con inmigración ni ninguna agencia gubernamental." },
  { q: "¿Qué documentos necesito para aplicar?", a: "ITIN válido, identificación con foto (pasaporte, matrícula consular), comprobante de domicilio y declaraciones de impuestos de los últimos 2-3 años." },
];

export default function IULParaIndocumentados() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead
            title="Seguro de Vida para Indocumentados con ITIN | Sin SSN"
            description="¿Tienes ITIN pero no SSN? Puedes aplicar a un seguro de vida IUL. Protege a tu familia y ahorra para el futuro. Explicación en español."
            keywords="seguro de vida para indocumentados, IUL con ITIN, seguro de vida sin SSN, seguro sin seguro social, seguro de vida para inmigrantes, ITIN insurance"
            canonical={`${DOMAIN}/iul-para-indocumentados`}
            jsonLd={[
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
                  { "@type": "ListItem", position: 3, name: "IUL para Indocumentados", item: `${DOMAIN}/iul-para-indocumentados` },
                ],
              },
            ]}
          />

          <Breadcrumbs items={[{ label: "Seguro de Vida IUL", href: "/seguro-de-vida-iul" }, { label: "IUL con ITIN" }]} t={t} />

          {/* HERO */}
          <section className="pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7`}>
                  <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">🌎 Acceso con ITIN</span>
                </div>
                <h1 className={`text-4xl sm:text-5xl font-normal leading-[1.1] mb-6 ${t.text}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Seguro de Vida IUL con ITIN —{" "}
                  <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                    Sin Necesidad de Seguro Social
                  </span>
                </h1>
                <p className={`text-lg ${t.textMid} max-w-2xl mx-auto leading-relaxed`}>
                  Si declaras impuestos con ITIN, ya tienes lo que necesitas para proteger a tu familia y construir un plan de retiro formal en Estados Unidos. <strong className="text-[#1d9fa9]">Tu estatus migratorio no define tu futuro financiero.</strong>
                </p>
              </Anim>
            </div>
          </section>

          {/* REQUISITOS */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¿Qué necesitas para <span className="italic text-[#1d9fa9]">aplicar</span>?
                </h2>
              </Anim>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: "📄", title: "ITIN Válido", desc: "Tu número de identificación tributaria del IRS. Lo obtienes al declarar impuestos." },
                  { icon: "🪪", title: "Identificación con Foto", desc: "Pasaporte vigente, matrícula consular o identificación de tu país de origen." },
                  { icon: "📋", title: "Tax Returns", desc: "Declaraciones de impuestos de los últimos 2-3 años. Demuestra tus ingresos y disciplina fiscal." },
                  { icon: "🏠", title: "Comprobante de Domicilio", desc: "Recibo de servicios, contrato de alquiler o estado de cuenta bancario." },
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

          {/* MITOS VS REALIDAD */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Mitos vs <span className="italic text-[#1d9fa9]">Realidad</span>
                </h2>
              </Anim>
              <div className="space-y-4">
                {[
                  { myth: "\"Sin SSN no puedo tener seguro de vida\"", reality: "Falso. Muchas aseguradoras aceptan ITIN como identificación válida para aplicar." },
                  { myth: "\"Inmigración puede ver mi información\"", reality: "Falso. Las aseguradoras no comparten información con agencias migratorias. Tu privacidad está protegida." },
                  { myth: "\"Si me deportan pierdo todo\"", reality: "Falso. Tu póliza es un contrato legal. Tus beneficiarios pueden cobrar sin importar tu ubicación." },
                  { myth: "\"Es muy caro para alguien en mi situación\"", reality: "Falso. Las primas comienzan desde $200/mes y se adaptan a tu presupuesto." },
                ].map((item, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-6 backdrop-blur-xl`}>
                      <div className="flex items-start gap-4">
                        <span className="text-red-500 font-bold text-lg shrink-0">✗</span>
                        <div>
                          <p className={`text-sm font-semibold text-red-500 mb-1 line-through`}>{item.myth}</p>
                          <div className="flex items-start gap-2 mt-2">
                            <CheckIcon className="text-[#1d9fa9] shrink-0 mt-0.5" />
                            <p className={`text-sm ${t.textMid} leading-relaxed`}>{item.reality}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* PRIVACIDAD */}
          <section className={`${t.bg2} py-20 px-6`}>
            <div className="max-w-3xl mx-auto text-center">
              <Anim>
                <div className="text-5xl mb-5">🔒</div>
                <h2 className={`text-3xl font-normal ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Tu privacidad es <span className="italic text-[#1d9fa9]">nuestra prioridad</span>
                </h2>
                <p className={`text-[15px] ${t.textMid} leading-relaxed max-w-xl mx-auto mb-8`}>
                  Entendemos tus preocupaciones. Por eso queremos que sepas: toda la información que nos compartas es estrictamente confidencial. Las aseguradoras están reguladas por leyes federales y estatales de privacidad. <strong className={t.text}>Tu información nunca se comparte con agencias de inmigración.</strong>
                </p>
                <Link to="/contacto" className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-lg font-bold no-underline hover:shadow-lg transition-all">
                  Agenda tu Consulta Confidencial →
                </Link>
              </Anim>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 px-6">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <h2 className={`text-3xl font-normal ${t.text} text-center mb-10`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Preguntas frecuentes sobre <span className="italic text-[#1d9fa9]">IUL con ITIN</span>
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

              <Anim delay={0.3}>
                <div className="mt-8 text-center flex flex-wrap justify-center gap-4">
                  <Link to="/seguro-de-vida-iul" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">← ¿Qué es el IUL?</Link>
                  <Link to="/iul-para-jubilacion" className="text-[#1d9fa9] font-semibold no-underline hover:underline text-sm">IUL para Jubilación →</Link>
                </div>
              </Anim>
            </div>
          </section>

          <LeadForm t={t} dark={dark} defaultInteres="Proteger a mi familia" />
          <div className="px-6 pb-12"><ContactBar t={t} /></div>
        </>
      )}
    </Layout>
  );
}

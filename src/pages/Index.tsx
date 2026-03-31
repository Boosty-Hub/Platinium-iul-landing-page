import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";
import { Anim } from "@/components/shared/Anim";
import { CountUp } from "@/components/shared/CountUp";
import { CheckIcon, StarIcon } from "@/components/shared/Icons";
import { LeadForm } from "@/components/shared/LeadForm";
import { ContactBar } from "@/components/shared/ContactBar";
import { FAQS, BENEFITS, STEPS, BANK_VS_IUL, FULL_COMPARISON, TABS, TESTIMONIALS } from "@/components/shared/data";
import logoCigna from "@/assets/logos/cigna.svg";
import logoOscar from "@/assets/logos/oscar.svg";
import logoMolina from "@/assets/logos/molina.svg";
import logoBluecross from "@/assets/logos/bluecross.svg";
import logoUnited from "@/assets/logos/unitedhealthcare.svg";
import logoAetna from "@/assets/logos/aetna.svg";
import logoFriday from "@/assets/logos/friday.svg";
import logoFloridaBlue from "@/assets/logos/floridablue.svg";
import logoNationalLife from "@/assets/logos/nationallife.webp";
import logoFidelity from "@/assets/logos/fidelity.svg";
import logoAmeritas from "@/assets/logos/ameritas.svg";
import logoAmericanAmicable from "@/assets/logos/americanamicable.svg";
import consultationImg from "@/assets/consultation.jpg";

const SEO = {
  title: "Seguro de Vida IUL en Estados Unidos | Ahorro + Protección para Hispanos | Platinium Insurance",
  description: "Protege a tu familia y construye tu retiro con un seguro IUL en Estados Unidos. Aceptamos ITIN. Atención en español. Cotiza gratis hoy.",
  keywords: "seguro de vida IUL, seguro de vida con ahorro, seguro de vida universal indexado, IUL Estados Unidos, seguro de vida para hispanos, seguro de vida que genera dinero, seguro de vida que sirve en vida, qué es un seguro IUL en español, cómo funciona el IUL, seguro de vida que crece con el mercado, seguro de vida permanente hispanos, póliza de vida con valor en efectivo, IUL para latinos, agente de seguros IUL, cotización IUL gratis",
};

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    name: "Platinium Insurance Group",
    url: DOMAIN,
    logo: `${DOMAIN}/logo.png`,
    image: `${DOMAIN}/og-image.jpg`,
    description: SEO.description,
    telephone: "+1-689-308-2809",
    email: "info@platiniuminsuranceusa.com",
    address: { "@type": "PostalAddress", streetAddress: "5775 Waterford District Dr #170", addressLocality: "Miami", addressRegion: "FL", postalCode: "33126", addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: 25.7617, longitude: -80.1918 },
    areaServed: [
      { "@type": "Country", name: "United States" },
    ],
    priceRange: "$$",
    openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "10:00", closes: "17:00" },
    sameAs: ["https://www.instagram.com/platiniuminsurancegroup"],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Seguro de Vida Universal Indexado (IUL)",
    provider: { "@type": "InsuranceAgency", name: "Platinium Insurance Group" },
    description: "Seguro de vida permanente con acumulación de valor indexado al mercado, protección familiar y plan de retiro para la comunidad hispana en Estados Unidos.",
    areaServed: { "@type": "Country", name: "United States" },
    audience: { "@type": "Audience", audienceType: "Hispanos y latinos en Estados Unidos" },
  },
];

const INSURANCE_LOGOS = [
  { src: logoCigna, alt: "Cigna" },
  { src: logoOscar, alt: "Oscar Health" },
  { src: logoMolina, alt: "Molina Healthcare" },
  { src: logoBluecross, alt: "Blue Cross Blue Shield" },
  { src: logoUnited, alt: "UnitedHealthcare" },
  { src: logoAetna, alt: "Aetna CVS Health" },
  { src: logoFriday, alt: "Friday Health Plans" },
  { src: logoFloridaBlue, alt: "Florida Blue" },
  { src: logoNationalLife, alt: "National Life Group" },
  { src: logoFidelity, alt: "Fidelity Investments" },
  { src: logoAmeritas, alt: "Ameritas" },
  { src: logoAmericanAmicable, alt: "American Amicable" },
];

export default function HomePage() {
  const [tab, setTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <Layout>
      {({ t, dark }) => (
        <>
          <SEOHead title={SEO.title} description={SEO.description} keywords={SEO.keywords} canonical={DOMAIN} jsonLd={JSON_LD} />

          {/* HERO */}
          <section className="lg:min-h-screen flex flex-col justify-center relative overflow-hidden" aria-label="Inicio">
            <div className="absolute top-[8%] right-[3%] w-80 h-80 rounded-full border border-[#1d9fa9]/[0.06] animate-[spin_80s_linear_infinite] pointer-events-none" />
            <div className="absolute bottom-[12%] left-[3%] w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(29,159,169,0.06),transparent_70%)] animate-[pulse_7s_ease-in-out_infinite] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-16 sm:pt-[120px] pb-[20px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                {/* Hero text - hidden on mobile, visible on lg */}
                <div className="max-w-xl hidden lg:block">
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7 animate-[fadeUp_0.8s_ease]`}>
                    <span className="w-2 h-2 rounded-full bg-[#1d9fa9] shadow-[0_0_8px_rgba(29,159,169,0.5)]" />
                    <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">Asesoría Financiera para Latinos en Estados Unidos</span>
                  </div>

                  <h1
                    className={`text-4xl sm:text-5xl lg:text-[56px] font-normal leading-[1.08] mb-6 ${t.text}`}
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Protege a tu familia.{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      Construye tu retiro.
                    </span>
                    <br />
                    <span className={`${t.textMuted} text-[0.55em] font-normal`}>Con un Indexed Universal Life (IUL).</span>
                  </h1>

                  <p className={`text-lg leading-relaxed ${t.textMid} max-w-xl mb-5`}>
                    Mientras tu dinero duerme en el banco ganando 0.05%, las familias con un <strong className={t.text}>IUL ganan hasta 12% anual</strong> vinculado al S&P 500 — <strong className={t.text}>sin riesgo de pérdida</strong> cuando el mercado cae.
                  </p>
                  <p className={`text-base leading-relaxed ${t.textMid} max-w-xl mb-9`}>
                    Protección permanente + plan de retiro + acceso a tu dinero sin penalidades. <strong className="text-[#1d9fa9]">Todo en un solo instrumento.</strong>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
                    <Link to="/contacto" className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-9 py-4 rounded-lg font-bold text-base tracking-wide no-underline hover:shadow-xl hover:shadow-[#1d9fa9]/25 transition-all hover:-translate-y-0.5 text-center">
                      Agenda tu Consulta Gratis →
                    </Link>
                    <Link to="/seguro-de-vida-iul" className="border-2 border-[#1d9fa9] text-[#1d9fa9] px-8 py-3.5 rounded-lg font-semibold text-[15px] no-underline hover:bg-[#1d9fa9]/10 transition-all text-center">
                      ¿Cómo funciona el IUL?
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-6" aria-label="Garantías">
                    {[["Aplicable con ", "ITIN"], ["Piso garantizado ", "0%"], ["Consulta ", "100% gratis"]].map(([pre, bold], i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckIcon className="text-[#1d9fa9]" />
                        <span className={`text-sm ${t.textMid}`}>{pre}<strong className={t.text}>{bold}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile compact hero text + form */}
                <div className="lg:hidden text-center mb-2">
                  <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-4 py-1.5 mb-4`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1d9fa9]" />
                    <span className="text-[10px] text-[#1d9fa9] font-bold tracking-[1px] uppercase">Asesoría para Latinos en EE.UU.</span>
                  </div>
                  <h1
                    className={`text-2xl sm:text-3xl font-normal leading-[1.15] mb-3 ${t.text}`}
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Protege a tu familia.{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-clip-text text-transparent">
                      Construye tu retiro.
                    </span>
                  </h1>
                  <p className={`text-sm ${t.textMid} mb-1`}>
                    Con un <strong className={t.text}>Indexed Universal Life (IUL)</strong>
                  </p>
                </div>

                <div>
                  <LeadForm t={t} dark={dark} inline />
                </div>
              </div>

              {/* Compact contact bar */}
              <ContactBar t={t} compact />

              {/* Insurance logos marquee */}
              <div className="mt-10 overflow-hidden rounded-xl">
                <div className="flex items-center" style={{ animation: "marquee 30s linear infinite", width: "max-content" }}>
                  {[...INSURANCE_LOGOS, ...INSURANCE_LOGOS].map((logo, i) => (
                    <div key={i} className={`flex items-center justify-center mx-8 shrink-0 h-16 ${dark ? "opacity-70 hover:opacity-100" : "opacity-60 hover:opacity-100"} transition-opacity`}>
                      <img src={logo.src} alt={logo.alt} className={`h-12 w-auto max-w-[140px] object-contain ${dark ? "brightness-0 invert" : ""}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Offices & Hours */}
              <div className={`mt-10 ${t.card} border rounded-2xl p-8 backdrop-blur-xl max-w-6xl mx-auto`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[11px] tracking-[2px] text-[#1d9fa9] uppercase mb-4 font-bold">📍 Oficinas</h4>
                    <div className={`text-sm ${t.textMuted} space-y-3 leading-relaxed`}>
                      <div>
                        <p className="font-semibold text-[#1d9fa9]">Miami, FL (Central)</p>
                        <p>5775 Waterford District Dr #170, Miami, FL 33126</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1d9fa9]">Orlando, FL</p>
                        <p>13550 Village Park Dr, Orlando, FL 32837</p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1d9fa9]">Houston, TX</p>
                        <p>16225 Park Ten Place, Of. 475, 4to Piso, Houston, TX 77084</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] tracking-[2px] text-[#1d9fa9] uppercase mb-4 font-bold">🕒 Horarios de Atención</h4>
                    <div className={`text-sm ${t.textMuted} leading-relaxed space-y-1`}>
                      <p>Lunes a Viernes: 10:00 A.M. a 5:00 P.M.</p>
                      <p>Sábado: Cerrado</p>
                      <p>Domingo: Cerrado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discover more */}
              <div className="flex items-center justify-center mt-10 lg:mt-14">
                <div className="flex flex-col items-center gap-2 animate-bounce">
                  <span className={`text-[10px] tracking-[2px] ${t.textMuted} uppercase`}>Descubre más</span>
                  <svg className="w-5 h-5 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* STATS BAR */}
          <section className={`${t.bg2} ${t.divider} border-y`} aria-label="Estadísticas del mercado">
            <div className="max-w-7xl mx-auto px-6 py-11 flex flex-col sm:flex-row justify-around items-center gap-5 sm:gap-4 flex-wrap">
              {[
                { v: <CountUp end={3710} prefix="$" suffix="B" />, l: "Mercado de seguros EE.UU. para 2033" },
                { v: <CountUp end={62} suffix="M" />, l: "Hispanos en Estados Unidos" },
                { v: "0%", l: "Piso garantizado en caídas de mercado" },
                { v: <CountUp end={12} suffix="%" />, l: "Cap de rendimiento anual potencial" },
              ].map((s, i) => (
                <Anim key={i} delay={i * 0.1}>
                  <div className="text-center min-w-[170px]">
                    <div className="text-4xl font-bold text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</div>
                    <div className={`text-[11px] ${t.textMuted} mt-1.5 tracking-wide max-w-[170px]`}>{s.l}</div>
                  </div>
                </Anim>
              ))}
            </div>
          </section>

          {/* PAIN POINTS */}
          <section className="py-24 px-6" aria-labelledby="pain-heading">
            <div className="max-w-4xl mx-auto text-center">
              <Anim>
                <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">¿Te identificas?</p>
                <h2 id="pain-heading" className={`text-3xl sm:text-4xl font-normal leading-tight ${t.text} mb-4`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Si trabajas duro pero <em className="text-[#1d9fa9]">no tienes un plan</em>,<br />tu esfuerzo se pierde cada día
                </h2>
                <p className={`text-base ${t.textMuted} max-w-xl mx-auto mb-2`}>
                  La inflación se come tus ahorros. El banco te paga 0.05%. Y si mañana no puedes trabajar, ¿quién mantiene a tu familia?
                </p>
                <div className="w-16 h-[3px] bg-gradient-to-r from-transparent via-[#1d9fa9] to-transparent mx-auto mt-5 mb-10 rounded" />
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                  { icon: "😰", text: "Trabajas 50+ horas y tu cuenta de ahorros no crece" },
                  { icon: "🏦", text: "Tu banco te paga 0.05% mientras la inflación sube 3-5%" },
                  { icon: "❌", text: "Sin 401(k), sin pensión, sin plan de retiro formal" },
                  { icon: "👨‍👩‍👧‍👦", text: "Si mañana no puedes trabajar, ¿quién mantiene a tu familia?" },
                ].map((p, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <div className={`${t.card} border rounded-xl p-5 flex items-start gap-4 backdrop-blur-xl`}>
                      <span className="text-2xl shrink-0">{p.icon}</span>
                      <p className={`text-sm ${t.textMid} leading-relaxed`}>{p.text}</p>
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* BENEFITS */}
          <section id="beneficios" className={`${t.bg2} py-24 px-6`} aria-labelledby="benefits-heading">
            <div className="max-w-7xl mx-auto">
              <Anim>
                <div className="text-center mb-14">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Beneficios reales</p>
                  <h2 id="benefits-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Un instrumento,{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">múltiples beneficios</span>
                  </h2>
                </div>
              </Anim>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {BENEFITS.map((n, i) => (
                  <Anim key={i} delay={i * 0.08}>
                    <Link to={n.link} className="no-underline block h-full">
                      <article className={`${t.card} border rounded-2xl p-8 h-full flex flex-col backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1d9fa9]/30`}>
                        <span className="text-4xl mb-4" role="img" aria-hidden="true">{n.icon}</span>
                        <h3 className={`text-xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{n.title}</h3>
                        <p className={`text-sm ${t.textMuted} leading-relaxed flex-1`}>{n.desc}</p>
                        <div className="mt-4 flex items-center gap-2 text-[#1d9fa9] text-sm font-semibold">
                          Saber más →
                        </div>
                      </article>
                    </Link>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="como-funciona" className="py-24 px-6" aria-labelledby="steps-heading">
            <div className="max-w-6xl mx-auto">
              <Anim>
                <div className="text-center mb-14">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Proceso simple</p>
                  <h2 id="steps-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Tu camino hacia la{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">protección financiera</span>
                  </h2>
                </div>
              </Anim>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  {STEPS.map((s, i) => (
                    <Anim key={i} delay={i * 0.12}>
                      <div className="flex gap-7 mb-10 items-start">
                        <div className="shrink-0 w-20 h-20 flex items-center justify-center border-2 border-[#1d9fa9] rounded-2xl relative">
                          <span className="text-3xl font-light text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.n}</span>
                          {i < STEPS.length - 1 && <div className="absolute -bottom-11 left-1/2 w-[2px] h-10 bg-gradient-to-b from-[#1d9fa9]/40 to-transparent rounded" />}
                        </div>
                        <div className="pt-1.5">
                          <h3 className={`text-2xl font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{s.t}</h3>
                          <p className={`text-[15px] ${t.textMid} leading-relaxed max-w-lg`}>{s.d}</p>
                        </div>
                      </div>
                    </Anim>
                  ))}
                </div>
                <Anim delay={0.3}>
                  <div className="rounded-3xl overflow-hidden shadow-xl shadow-[#1d9fa9]/10 border border-[#1d9fa9]/10">
                    <img src={consultationImg} alt="Asesor financiero en consulta con una familia latina" className="w-full h-auto object-cover" width={512} height={320} loading="lazy" />
                  </div>
                </Anim>
              </div>
            </div>
          </section>

          {/* COMPARISON */}
          <section id="comparativa" className={`${t.bg2} py-24 px-6`} aria-labelledby="comparison-heading">
            <div className="max-w-4xl mx-auto">
              <Anim>
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[3px] text-red-500 uppercase font-bold mb-4">La verdad en números</p>
                  <h2 id="comparison-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Tu cuenta de banco <em className="text-red-500">no es suficiente</em>
                  </h2>
                  <p className={`text-base ${t.textMuted} max-w-xl mx-auto mt-4`}>Compara el rendimiento real de ahorrar en un banco vs un IUL con protección incluida.</p>
                </div>
              </Anim>

              <Anim delay={0.15}>
                <div className="overflow-x-auto mb-4">
                  <table className={`w-full ${t.divider} border rounded-xl overflow-hidden`} role="table" aria-label="Banco vs IUL">
                    <thead>
                      <tr className={t.brandBg}>
                        <th className={`text-left p-4 text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Característica</th>
                        <th className={`text-center p-4 text-[11px] tracking-[2px] ${t.textMuted} uppercase font-bold`}>Banco</th>
                        <th className="text-center p-4 text-[11px] tracking-[2px] text-[#1d9fa9] uppercase font-bold">IUL ✦</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BANK_VS_IUL.map((r, i) => (
                        <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                          <td className={`p-4 text-sm ${t.text} font-medium`}>{r.f}</td>
                          <td className={`p-4 text-sm ${t.textMuted} text-center`}>{r.b}</td>
                          <td className="p-4 text-sm text-[#1d9fa9] text-center font-semibold">{r.i}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={`text-[11px] ${t.textMuted} italic`}>*Retiros mediante préstamos de la póliza pueden ser libres de impuestos cuando se estructuran correctamente.</p>
              </Anim>

              <Anim delay={0.2}>
                <div className="text-center mt-8">
                  <Link to="/iul-vs-401k" className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-3.5 rounded-lg font-bold no-underline hover:shadow-lg transition-all">
                    Ver comparación completa IUL vs 401(k) →
                  </Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* NICHE TABS */}
          <section className="py-24 px-6" aria-labelledby="niche-heading">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <div className="text-center mb-10">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Soluciones específicas</p>
                  <h2 id="niche-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    ¿En qué situación{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">estás tú</span>?
                  </h2>
                </div>
              </Anim>

              <Anim delay={0.1}>
                <div className="flex flex-wrap gap-2 justify-center mb-7" role="tablist">
                  {TABS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setTab(i)}
                      role="tab"
                      aria-selected={tab === i}
                      className={`px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all border ${
                        tab === i ? "bg-[#1d9fa9]/10 border-[#1d9fa9] text-[#1d9fa9]" : `${t.divider} ${t.textMid} hover:border-[#1d9fa9]/30`
                      }`}
                    >
                      {item.t}
                    </button>
                  ))}
                </div>

                <div role="tabpanel" className={`${t.card} border rounded-2xl p-10 text-center backdrop-blur-xl`}>
                  <h3 className="text-2xl font-semibold text-[#1d9fa9] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{TABS[tab].t}</h3>
                  <p className={`text-[15px] ${t.textMid} leading-relaxed max-w-xl mx-auto`}>{TABS[tab].c}</p>
                  <Link to="/contacto" className="inline-block mt-7 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-3.5 rounded-lg font-bold no-underline hover:shadow-lg transition-all">
                    Quiero mi plan personalizado →
                  </Link>
                </div>
              </Anim>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section id="testimonios" className="py-24 px-6" aria-labelledby="testimonials-heading">
            <div className="max-w-7xl mx-auto">
              <Anim>
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Historias reales</p>
                  <h2 id="testimonials-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Familias que ya están{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">construyendo su futuro</span>
                  </h2>
                </div>
              </Anim>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TESTIMONIALS.map((item, i) => (
                  <Anim key={i} delay={i * 0.12}>
                    <blockquote className={`${t.card} border rounded-2xl p-8 h-full flex flex-col backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg`}>
                      <span className="text-3xl text-[#1d9fa9] opacity-25 leading-none">"</span>
                      <p className={`text-sm ${t.textMid} leading-relaxed flex-1 italic my-3`}>"{item.text}"</p>
                      <div className="flex gap-0.5 mb-3 text-[#1d9fa9]">
                        {Array(item.stars).fill(0).map((_, j) => <StarIcon key={j} />)}
                      </div>
                      <cite className="not-italic flex items-center gap-3">
                        <img src={item.img} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#1d9fa9]/20" width={48} height={48} loading="lazy" />
                        <div>
                          <div className={`text-base font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</div>
                          <div className={`text-xs ${t.textMuted} mt-0.5`}>{item.role}</div>
                        </div>
                      </cite>
                    </blockquote>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className={`${t.bg2} py-24 px-6`} aria-labelledby="faq-heading">
            <div className="max-w-3xl mx-auto">
              <Anim>
                <div className="text-center mb-12">
                  <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Preguntas frecuentes</p>
                  <h2 id="faq-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Respuestas claras,{" "}
                    <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">sin letra pequeña</span>
                  </h2>
                </div>
              </Anim>

              <div className="space-y-3">
                {FAQS.map((faq, i) => (
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
                      {faqOpen === i && (
                        <div className={`px-5 pb-5 text-sm ${t.textMid} leading-relaxed animate-[fadeUp_0.3s_ease]`}>{faq.a}</div>
                      )}
                    </div>
                  </Anim>
                ))}
              </div>
            </div>
          </section>

          {/* LEAD FORM with hero image as sidebar */}
          <LeadForm t={t} dark={dark} sidebarContent={
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <img alt="Familia latina protegida con un plan IUL" className="w-full h-auto object-contain" width={640} height={384} loading="lazy" src="/lovable-uploads/3658c176-85e0-4ba2-80c5-30909eeb0c4d.webp" />
              </div>
              <div className={`absolute ${t.card} border rounded-2xl p-5 backdrop-blur-xl shadow-xl`} style={{ bottom: "3rem", left: "0rem" }}>
                <div className="text-3xl font-bold text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>$200K+</div>
                <div className={`text-xs ${t.textMuted} mt-1`}>Valor potencial en 20 años<br />con solo $250/mes</div>
              </div>
            </div>
          } />

          {/* CONTACT BAR */}
          <div className="px-6 pb-12">
            <ContactBar t={t} />
          </div>

          {/* FINAL CTA */}
          <section className="py-20 px-6 text-center" aria-label="Llamado final">
            <Anim>
              <div className="max-w-2xl mx-auto">
                <h2 className={`text-3xl sm:text-[44px] font-normal ${t.text} leading-tight mb-5`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Tu familia merece{" "}
                  <strong className="italic bg-gradient-to-r from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_ease-in-out_infinite]">
                    un plan
                  </strong>
                </h2>
                <p className={`text-base ${t.textMid} leading-relaxed mb-8`}>
                  No importa si tienes SSN o ITIN. No importa si eres W-2 o 1099. Lo que importa es que hoy puedes dar el primer paso para proteger lo que más quieres.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                  <Link to="/contacto" className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-9 py-4 rounded-lg font-bold no-underline hover:shadow-xl transition-all text-center">
                    Agenda tu Consulta Gratis
                  </Link>
                  <a href="tel:+16893082809" className="border-2 border-[#1d9fa9] text-[#1d9fa9] px-8 py-3.5 rounded-lg font-semibold no-underline hover:bg-[#1d9fa9]/10 transition-all inline-flex items-center justify-center gap-2">
                    Llámanos ahora
                  </a>
                </div>
              </div>
            </Anim>
          </section>
        </>
      )}
    </Layout>
  );
}

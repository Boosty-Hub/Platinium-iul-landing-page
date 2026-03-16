// ============================================================
// FILE: src/pages/Index.tsx
// Platinium Insurance Group — IUL Landing Page
// Stack: React + Tailwind CSS + Supabase (Lovable)
// DB: Supabase (leads table) + Edge Function → Kommo CRM
// Domain: platiniuminsuranceusa.com
// ============================================================

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Phone, Instagram } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import heroFamilyImg from "@/assets/hero-family.jpg";
import testimonial1Img from "@/assets/testimonial-1.jpg";
import testimonial2Img from "@/assets/testimonial-2.jpg";
import testimonial3Img from "@/assets/testimonial-3.jpg";
import consultationImg from "@/assets/consultation.jpg";
import familyHomeImg from "@/assets/family-home.jpg";

// ─── BRAND TOKENS ────────────────────────────────────────────
const BRAND = {
  primary: "#1d9fa9",
  primaryDark: "#177D85",
  primaryLight: "#28C4CF",
  primaryGhost: "rgba(29,159,169,0.06)",
  primaryBorder: "rgba(29,159,169,0.15)"
} as const;

// ─── SEO HEAD (react-helmet-async) ──────────────────────────
const DOMAIN = "https://platiniuminsuranceusa.com";
const SEO = {
  title: "Seguro de Vida IUL para Latinos en Miami | Platinium Insurance Group",
  description:
  "Protege a tu familia y construye tu retiro con un Seguro de Vida Universal Indexado (IUL). Consulta gratuita en español. Aceptamos ITIN. Platinium Insurance Group, Miami FL.",
  keywords:
  "seguro de vida universal indexado, IUL, IUL para latinos, seguro de vida IUL Miami, IUL para hispanos, seguro de vida con ITIN, plan de retiro latinos USA, IUL vs 401k, seguro indexado en español, agente de seguros IUL Miami, cotización IUL gratis, seguro de vida permanente hispanos, IUL para retiro, IUL para pagar hipoteca, seguro de vida Doral, seguro de vida Hialeah, Platinium Insurance Group",
  og_image: `${DOMAIN}/og-image.jpg`,
  locale: "es_US"
};

function SEOHead() {
  return (
    <Helmet>
      <html lang="es" />
      <title>{SEO.title}</title>
      <meta name="description" content={SEO.description} />
      <meta name="keywords" content={SEO.keywords} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
      <link rel="canonical" href={DOMAIN} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={DOMAIN} />
      <meta property="og:title" content={SEO.title} />
      <meta property="og:description" content={SEO.description} />
      <meta property="og:image" content={SEO.og_image} />
      <meta property="og:locale" content={SEO.locale} />
      <meta property="og:site_name" content="Platinium Insurance Group" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SEO.title} />
      <meta name="twitter:description" content={SEO.description} />
      <meta name="twitter:image" content={SEO.og_image} />

      {/* Geo */}
      <meta name="geo.region" content="US-FL" />
      <meta name="geo.placename" content="Miami" />

      {/* Preconnect fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
        rel="stylesheet" />
      

      {/* JSON-LD: LocalBusiness */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "InsuranceAgency",
          name: "Platinium Insurance Group",
          url: DOMAIN,
          logo: `${DOMAIN}/logo.png`,
          image: SEO.og_image,
          description: SEO.description,
          telephone: "+1-786-XXX-XXXX",
          email: "info@platiniuminsuranceusa.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "DIRECCIÓN_AQUÍ",
            addressLocality: "Miami",
            addressRegion: "FL",
            postalCode: "33XXX",
            addressCountry: "US"
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 25.7617,
            longitude: -80.1918
          },
          areaServed: [
          { "@type": "City", name: "Miami" },
          { "@type": "City", name: "Doral" },
          { "@type": "City", name: "Hialeah" },
          { "@type": "City", name: "Homestead" },
          { "@type": "State", name: "Florida" }],

          priceRange: "$$",
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "18:00"
          },
          sameAs: [
          "https://www.instagram.com/platiniuminsurance",
          "https://www.facebook.com/platiniuminsurance"]

        })}
      </script>

      {/* JSON-LD: FAQPage */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a }
          }))
        })}
      </script>

      {/* JSON-LD: Service */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Seguro de Vida Universal Indexado (IUL)",
          provider: {
            "@type": "InsuranceAgency",
            name: "Platinium Insurance Group"
          },
          description:
          "Seguro de vida permanente con acumulación de valor indexado al mercado, protección familiar y plan de retiro para la comunidad hispana en Miami.",
          areaServed: { "@type": "State", name: "Florida" },
          audience: {
            "@type": "Audience",
            audienceType: "Hispanos y latinos en Estados Unidos"
          }
        })}
      </script>
    </Helmet>);

}

// ─── DATA ────────────────────────────────────────────────────

const FAQS = [
{
  q: "¿Qué es exactamente un Seguro de Vida Universal Indexado (IUL)?",
  a: "Es un seguro de vida permanente que combina protección financiera para tu familia con un componente de acumulación de valor en efectivo. Tu dinero crece vinculado a índices del mercado como el S&P 500, pero con una protección: si el mercado baja, tu dinero no pierde valor gracias a un piso garantizado. Es protección + crecimiento en un solo instrumento."
},
{
  q: "¿El IUL es una inversión o un seguro?",
  a: "Técnicamente es un seguro de vida, no un producto de inversión regulado por la SEC. Tu dinero no se invierte directamente en la bolsa de valores. En su lugar, gana intereses basados en el rendimiento de índices bursátiles, con límites de ganancia (cap) y un piso que protege contra pérdidas."
},
{
  q: "¿Puedo aplicar si tengo ITIN y no tengo número de Seguro Social?",
  a: "Sí. Puedes aplicar con ITIN, pasaporte o matrícula consular, siempre que hayas declarado impuestos en los últimos años. Esto lo convierte en una herramienta accesible para inmigrantes que buscan protección y ahorro formal en Estados Unidos."
},
{
  q: "¿Cuánto necesito para comenzar?",
  a: "Las primas son flexibles y se adaptan a tu presupuesto. Muchas familias comienzan con aportes desde $200 a $500 mensuales. Durante tu consulta gratuita, diseñamos un plan personalizado basado en tus ingresos, objetivos y situación familiar."
},
{
  q: "¿El IUL es mejor que un 401(k)?",
  a: "Son herramientas diferentes que pueden complementarse. El 401(k) es excelente si tu empleador hace matching, pero tiene límites de contribución y penalidades por retiro anticipado. El IUL ofrece acceso a tu dinero sin penalidades mediante préstamos de la póliza, protección por fallecimiento y beneficios en vida."
},
{
  q: "He escuchado que el IUL es una estafa, ¿es verdad?",
  a: "No es una estafa cuando se diseña y se explica correctamente. Las malas experiencias suelen venir de agentes que prometen rendimientos irreales o que no explican los costos. Por eso es crucial trabajar con un asesor licenciado que te muestre escenarios realistas y diseñe la póliza según tus necesidades reales."
},
{
  q: "¿Qué pasa si necesito dinero por una emergencia médica?",
  a: "El IUL incluye riders para enfermedades crónicas, críticas y terminales. Si sufres un evento de salud grave, puedes acceder a un adelanto del beneficio por fallecimiento para cubrir gastos médicos o de manutención, sin esperar a que alguien fallezca."
},
{
  q: "¿Cuánto tiempo tarda en acumularse el valor en efectivo?",
  a: "Los primeros años se enfocan en establecer la póliza. El crecimiento real se acelera a partir del año 5-7 gracias al interés compuesto. Por eso el IUL es una estrategia de mediano a largo plazo, ideal para personas que planifican su retiro con 15-30 años de anticipación."
}];


const NAV_LINKS = [
{ label: "Beneficios", href: "#beneficios" },
{ label: "Cómo Funciona", href: "#como-funciona" },
{ label: "Comparativa", href: "#comparativa" },
{ label: "Testimonios", href: "#testimonios" },
{ label: "FAQ", href: "#faq" }];


const BENEFITS = [
{ icon: "🏠", title: "Protección Familiar", desc: "Asegura el futuro de tu familia con un beneficio por fallecimiento que cubre hipoteca, deudas y nivel de vida. Tu legado, garantizado." },
{ icon: "📈", title: "Plan de Retiro", desc: "Construye tu jubilación con crecimiento indexado al mercado y acceso a tu dinero libre de impuestos mediante préstamos de la póliza." },
{ icon: "🏡", title: "Paga tu Hipoteca", desc: "Usa el valor acumulado para liquidar tu hipoteca en 15-20 años en vez de 30. Tu casa libre de deudas, más rápido." },
{ icon: "❤️", title: "Beneficios en Vida", desc: "Riders para enfermedades crónicas, críticas y terminales. Accede a tu beneficio cuando más lo necesitas, sin esperar." },
{ icon: "💼", title: "Negocio Familiar", desc: "Protege tu negocio y planifica la sucesión patrimonial. Ideal para dueños de restaurantes, construcción y comercio." },
{ icon: "🌎", title: "Acceso con ITIN", desc: "Aplica con ITIN, pasaporte o matrícula consular. Tu estatus migratorio no te impide proteger a tu familia." }];


const STEPS = [
{ n: "01", t: "Consulta Gratuita", d: "Hablamos sobre tu situación, tus metas y tu familia. Sin presión, sin compromiso. Solo información clara y honesta." },
{ n: "02", t: "Diseño Personalizado", d: "Creamos un plan a tu medida: prima flexible, riders opcionales, estrategia de indexación ajustada a tu perfil y horizonte temporal." },
{ n: "03", t: "Activación y Protección", d: "Desde el día uno tu familia está protegida. Tu póliza comienza a acumular valor en efectivo con el poder del interés compuesto." },
{ n: "04", t: "Acompañamiento Continuo", d: "Revisamos tu póliza periódicamente, ajustamos contribuciones y te educamos para que aproveches cada beneficio de tu IUL." }];


const BANK_VS_IUL = [
{ f: "Rendimiento anual", b: "0.05% – 0.30%", i: "0% – 12% (con protección)" },
{ f: "Protección ante caídas", b: "FDIC hasta $250K", i: "Piso garantizado 0%" },
{ f: "Beneficio por fallecimiento", b: "Ninguno", i: "Desde $250,000+" },
{ f: "Beneficios en vida", b: "Ninguno", i: "Enfermedades graves, crónicas, terminales" },
{ f: "Ventaja fiscal", b: "Intereses gravables", i: "Crecimiento diferido, retiros libres*" },
{ f: "Después de 20 años ($250/mes)", b: "≈ $61,500", i: "≈ $150,000 – $200,000+" }];


const FULL_COMPARISON = [
{ f: "Protección por fallecimiento", iul: true, bank: false, k: false, term: true },
{ f: "Crecimiento vinculado al mercado", iul: true, bank: false, k: true, term: false },
{ f: "Protección contra pérdidas (piso 0%)", iul: true, bank: true, k: false, term: false },
{ f: "Acceso al dinero sin penalidades", iul: true, bank: true, k: false, term: false },
{ f: "Beneficios fiscales en retiros", iul: true, bank: false, k: false, term: false },
{ f: "Riders de enfermedades graves", iul: true, bank: false, k: false, term: false },
{ f: "Cobertura de por vida", iul: true, bank: false, k: false, term: false },
{ f: "Aplicable con ITIN", iul: true, bank: true, k: false, term: true }];


const TABS = [
{ t: "Latinos con ITIN", c: "Si declaras impuestos con ITIN, ya tienes lo que necesitas para comenzar. El IUL es una de las pocas herramientas financieras formales accesibles sin SSN. Transforma tu disciplina tributaria en un plan de retiro y protección real para tu familia." },
{ t: "Dueños de Negocio", c: "Tu restaurante, tu negocio de limpieza, tu empresa de construcción: son el sustento de tu familia. El IUL protege ese legado con un beneficio por fallecimiento, riders para enfermedades graves y un plan de retiro que crece mientras tú trabajas." },
{ t: "Transportistas 1099", c: "Sin 401(k), sin beneficios de empleador, sin red de seguridad. Como conductor independiente, el IUL te da lo que nadie más te ofrece: protección permanente, ahorro para retiro y acceso a tu dinero cuando lo necesites." },
{ t: "Familias Jóvenes", c: "Entre más joven comiences, más poderoso es el interés compuesto. Protege a tus hijos desde hoy, asegura la casa familiar y construye un colchón financiero que crece con el tiempo." }];


const TESTIMONIALS = [
{ name: "María González", role: "Emprendedora, Miami", text: "Cuando llegué a este país solo tenía mi ITIN y muchos sueños. Nunca pensé que podría tener un plan de retiro formal. Hoy, después de 4 años con mi IUL, tengo protección para mi familia y un fondo que crece cada año. Mi asesora me explicó todo en español, sin letra pequeña.", stars: 5, img: testimonial1Img },
{ name: "Carlos Mendoza", role: "Transportista, Doral", text: "Como camionero independiente no tenía 401(k) ni beneficios. Mi agente me explicó todo con números reales, sin promesas falsas. Ahora tengo un plan que protege a mis hijos y me está ayudando a pagar mi casa más rápido. Mi única queja es no haber empezado antes.", stars: 5, img: testimonial2Img },
{ name: "Ana Patricia Ruiz", role: "Dueña de restaurante, Hialeah", text: "Al principio pensé que era demasiado bueno para ser verdad. Pero me mostraron los costos, los límites y los escenarios reales. Entendí que no es mágico, es una herramienta poderosa cuando se usa bien. Hoy duermo tranquila sabiendo que mi familia está protegida pase lo que pase.", stars: 5, img: testimonial3Img }];


// ─── HOOKS ───────────────────────────────────────────────────

function useInView(threshold = 0.12): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

// ─── REUSABLE COMPONENTS ─────────────────────────────────────

const Anim = memo(function Anim({
  children,
  delay = 0,
  className = ""




}: {children: React.ReactNode;delay?: number;className?: string;}) {
  const [ref, v] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(32px)",
        transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}s`
      }}>
      
      {children}
    </div>);

});

function CountUp({ end, suffix = "", prefix = "" }: {end: number;suffix?: string;prefix?: string;}) {
  const [c, setC] = useState(0);
  const [ref, v] = useInView();
  useEffect(() => {
    if (!v) return;
    let s = 0;
    const step = end / 125;
    const t = setInterval(() => {
      s += step;
      if (s >= end) {
        setC(end);
        clearInterval(t);
      } else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(t);
  }, [v, end]);
  return (
    <span ref={ref}>
      {prefix}
      {c.toLocaleString()}
      {suffix}
    </span>);

}

const CheckIcon = ({ className = "" }: {className?: string;}) =>
<svg className={`w-5 h-5 flex-shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>;


const StarIcon = () =>
<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>;


// ─── FORM HANDLER (Supabase + Kommo via Edge Function) ───────

interface LeadFormData {
  nombre: string;
  telefono: string;
  email: string;
  interes: string;
  anio_nacimiento: string;
  ahorro_semanal: string;
}

function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const result: Record<string, string> = {};
  utmKeys.forEach((key) => {
    const val = params.get(key);
    if (val) result[key] = val.slice(0, 100);
  });
  return result;
}

async function submitLead(data: LeadFormData): Promise<{ok: boolean;leadId?: string;}> {
  try {
    const utms = getUTMParams();

    // 1. Insertar en Supabase
    const { data: lead, error } = await supabase.
    from("leads").
    insert({
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      interes: data.interes || "",
      fuente: "landing-iul",
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent.slice(0, 500),
      anio_nacimiento: data.anio_nacimiento ? parseInt(data.anio_nacimiento) : null,
      ahorro_semanal: data.ahorro_semanal || null,
      notas: `Año nacimiento: ${data.anio_nacimiento || 'N/A'} | Ahorro semanal: $${data.ahorro_semanal || 'N/A'}`,
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null
    }).
    select("id").
    single();

    if (error) {
      console.error("Error insertando lead en Supabase:", error);
      return { ok: false };
    }

    // 2. Enviar a n8n webhook (fire-and-forget)
    const webhookPayload = {
      lead_id: lead?.id,
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      interes: data.interes || "",
      anio_nacimiento: data.anio_nacimiento || null,
      ahorro_semanal: data.ahorro_semanal || null,
      fuente: "landing-iul",
      referrer: document.referrer || "direct",
      utm_source: utms.utm_source || null,
      utm_medium: utms.utm_medium || null,
      utm_campaign: utms.utm_campaign || null,
      utm_content: utms.utm_content || null,
      utm_term: utms.utm_term || null,
      notas: `Año nacimiento: ${data.anio_nacimiento || 'N/A'} | Ahorro semanal: $${data.ahorro_semanal || 'N/A'}`,
      created_at: new Date().toISOString(),
    };

    fetch("https://n8n.security.boosty.digital/webhook/form-kommo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    })
      .then((res) => {
        if (!res.ok) console.warn("n8n webhook error (non-blocking):", res.status);
      })
      .catch((err) => console.warn("n8n webhook failed (non-blocking):", err));

    // 3. Sincronizar con Kommo via Edge Function (fire-and-forget)
    if (lead?.id) {
      supabase.functions.
      invoke("sync-lead-to-kommo", {
        body: { lead_id: lead.id }
      }).
      then((res) => {
        if (res.error) console.warn("Kommo sync error (no-blocking):", res.error);
      }).
      catch((err) => console.warn("Kommo sync failed (no-blocking):", err));
    }

    return { ok: true, leadId: lead?.id };
  } catch (err) {
    console.error("Error en submitLead:", err);
    return { ok: false };
  }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function IULLanding() {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollY = useScrollY();
  const [form, setForm] = useState<LeadFormData>({ nombre: "", telefono: "", email: "", interes: "", anio_nacimiento: "", ahorro_semanal: "" });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [step, setStep] = useState(1);
  const [honeypot, setHoneypot] = useState("");
  const formLoadedAt = useRef(Date.now());
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [tab, setTab] = useState(0);

  // Close mobile menu on resize
  useEffect(() => {
    const h = () => {if (window.innerWidth > 768) setMenuOpen(false);};
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Prevent scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {document.body.style.overflow = "";};
  }, [menuOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState === "loading") return;

    // Basic validation
    const phone = form.telefono.replace(/\D/g, "");
    if (phone.length < 10) {
      alert("Por favor ingresa un número de teléfono válido.");
      return;
    }
    if (!form.email.includes("@") || !form.email.includes(".")) {
      alert("Por favor ingresa un email válido.");
      return;
    }
    // Sanitize inputs
    const sanitized: LeadFormData = {
      nombre: form.nombre.trim().slice(0, 100),
      telefono: form.telefono.trim().slice(0, 20),
      email: form.email.trim().toLowerCase().slice(0, 100),
      interes: form.interes.slice(0, 50),
      anio_nacimiento: form.anio_nacimiento,
      ahorro_semanal: form.ahorro_semanal
    };

    setFormState("loading");
    const result = await submitLead(sanitized);
    setFormState(result.ok ? "success" : "error");
  }, [form, formState]);

  const updateField = useCallback((field: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Theme classes
  const t = dark ?
  {
    bg: "bg-[#0B1A1E]",
    bg2: "bg-[#0F2229]",
    card: "bg-[#0F2229]/80 border-[#1d9fa9]/15",
    text: "text-[#E4EEF0]",
    textMid: "text-[#94B3BB]",
    textMuted: "text-[#6A8E98]",
    nav: "bg-[#0B1A1E]/92",
    divider: "border-[#1d9fa9]/10",
    input: "bg-white/[0.04] border-white/10 text-[#E4EEF0]",
    brandBg: "bg-[#1d9fa9]/[0.08]",
    dangerBg: "bg-red-500/[0.05]",
    successBg: "bg-[#1d9fa9]/[0.05]"
  } :
  {
    bg: "bg-[#FAFCFC]",
    bg2: "bg-[#F0F6F7]",
    card: "bg-white/90 border-[#1d9fa9]/10",
    text: "text-[#1A2E33]",
    textMid: "text-[#4A6B73]",
    textMuted: "text-[#7A9BA3]",
    nav: "bg-[#FAFCFC]/92",
    divider: "border-[#1d9fa9]/10",
    input: "bg-black/[0.02] border-[#1d9fa9]/20 text-[#1A2E33]",
    brandBg: "bg-[#1d9fa9]/[0.05]",
    dangerBg: "bg-red-500/[0.03]",
    successBg: "bg-[#1d9fa9]/[0.04]"
  };

  return (
    <div className={`${t.bg} ${t.text} min-h-screen transition-colors duration-300`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SEOHead />

      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrollY > 50 ? `${t.nav} ${t.divider} border-b shadow-sm` : ""}`
        }
        role="navigation"
        aria-label="Navegación principal">
        
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 no-underline" aria-label="Platinium Insurance Group - Inicio">
            <img
              src="/logo.png"
              alt="Platinium Insurance Group"
              className="h-10 w-auto object-contain"
              width={40}
              height={40}
              loading="eager" />
            
            <div className="hidden sm:block">
              <div className="text-[15px] font-bold text-[#1d9fa9] leading-none tracking-wide">PLATINIUM INSURANCE</div>
              <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase`}>GROUP</div>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map((l) =>
            <a
              key={l.href}
              href={l.href}
              className={`${t.textMid} hover:text-[#1d9fa9] text-sm font-medium transition-colors no-underline`}>
              
                {l.label}
              </a>
            )}
            <button
              onClick={() => setDark(!dark)}
              className={`${t.brandBg} ${t.divider} border rounded-full px-3 py-1.5 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105`}
              aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              
              <span className="text-sm">{dark ? "☀️" : "🌙"}</span>
              <span className={`text-[11px] ${t.textMid} font-semibold`}>{dark ? "Light" : "Dark"}</span>
            </button>
            <a
              href="#consulta"
              className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide no-underline hover:shadow-lg hover:shadow-[#1d9fa9]/20 transition-all hover:-translate-y-0.5">
              
              Consulta Gratis
            </a>
          </div>

          {/* Mobile buttons */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className={`${t.divider} border rounded-lg p-2 cursor-pointer`}
              aria-label={dark ? "Modo claro" : "Modo oscuro"}>
              
              <span className="text-base">{dark ? "☀️" : "🌙"}</span>
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}>
              
              <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`w-[22px] h-[2px] bg-[#1d9fa9] transition-all ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen &&
        <div className={`lg:hidden ${t.nav} ${t.divider} border-t px-6 py-4`}>
            {NAV_LINKS.map((l) =>
          <a
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className={`block py-3.5 ${t.textMid} no-underline text-base ${t.divider} border-b`}>
            
                {l.label}
              </a>
          )}
            <a
            href="#consulta"
            onClick={() => setMenuOpen(false)}
            className="block text-center mt-4 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3 rounded-lg font-bold no-underline">
            
              Consulta Gratis
            </a>
          </div>
        }
      </nav>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col justify-center relative overflow-hidden" aria-label="Inicio">
        {/* Decorative */}
        <div className="absolute top-[8%] right-[3%] w-80 h-80 rounded-full border border-[#1d9fa9]/[0.06] animate-[spin_80s_linear_infinite] pointer-events-none" />
        <div className="absolute bottom-[12%] left-[3%] w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(29,159,169,0.06),transparent_70%)] animate-[pulse_7s_ease-in-out_infinite] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 pt-[120px] pb-[20px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 ${t.brandBg} border border-[#1d9fa9]/20 rounded-full px-5 py-2 mb-7 animate-[fadeUp_0.8s_ease]`}>
              <span className="w-2 h-2 rounded-full bg-[#1d9fa9] shadow-[0_0_8px_rgba(29,159,169,0.5)]" />
              <span className="text-xs text-[#1d9fa9] font-bold tracking-[1.5px] uppercase">
                Asesoría Financiera para Latinos en Miami
              </span>
            </div>

            {/* H1 */}
            <h1
                className={`text-4xl sm:text-5xl lg:text-[56px] font-normal leading-[1.08] mb-6 ${t.text}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif", animationDelay: "0.1s", animationFillMode: "both" }}>
                
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
              <a
                  href="#consulta"
                  className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-9 py-4 rounded-lg font-bold text-base tracking-wide no-underline hover:shadow-xl hover:shadow-[#1d9fa9]/25 transition-all hover:-translate-y-0.5 text-center">
                  
                Agenda tu Consulta Gratis →
              </a>
              <a
                  href="#como-funciona"
                  className="border-2 border-[#1d9fa9] text-[#1d9fa9] px-8 py-3.5 rounded-lg font-semibold text-[15px] no-underline hover:bg-[#1d9fa9]/10 transition-all text-center">
                  
                ¿Cómo funciona el IUL?
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6" aria-label="Garantías">
              {[["Aplicable con ", "ITIN"], ["Piso garantizado ", "0%"], ["Consulta ", "100% gratis"]].map(([pre, bold], i) =>
                <div key={i} className="flex items-center gap-2">
                  <CheckIcon className="text-[#1d9fa9]" />
                  <span className={`text-sm ${t.textMid}`}>
                    {pre}
                    <strong className={t.text}>{bold}</strong>
                  </span>
                </div>
                )}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative order-first lg:order-none">
            <div className="overflow-hidden shadow-[#1d9fa9]/10 border-[#1d9fa9]/10 bg-black/0 shadow-none rounded-none border-0">
              <img
                  alt="Familia latina protegida con un plan IUL"
                  className="w-full h-auto max-h-[500px] lg:max-h-none rounded-2xl lg:rounded-none object-contain"
                  width={640}
                  height={384}
                  loading="eager" src="/lovable-uploads/3658c176-85e0-4ba2-80c5-30909eeb0c4d.webp" />
                
            </div>
            {/* Floating stat card */}
            <div className={`absolute ${t.card} border rounded-2xl p-5 backdrop-blur-xl shadow-xl`} style={{ bottom: '3rem', left: '0rem' }}>
              <div className="text-3xl font-bold text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>$200K+</div>
              <div className={`text-xs ${t.textMuted} mt-1`}>Valor potencial en 20 años<br />con solo $250/mes</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - own row */}
        <div className="flex items-center justify-center mt-10 lg:mt-14">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className={`text-[10px] tracking-[2px] ${t.textMuted} uppercase`}>Descubre más</span>
            <svg className="w-5 h-5 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </div>

        </div>
      </section>

      {/* ─── STATS BAR ─────────────────────────────────────── */}
      <section className={`${t.bg2} ${t.divider} border-y`} aria-label="Estadísticas del mercado">
        <div className="max-w-7xl mx-auto px-6 py-11 flex flex-col sm:flex-row justify-around items-center gap-5 sm:gap-4 flex-wrap">
          {[
          { v: <CountUp end={3710} prefix="$" suffix="B" />, l: "Mercado de seguros EE.UU. para 2033" },
          { v: <CountUp end={62} suffix="M" />, l: "Hispanos en Estados Unidos" },
          { v: "0%", l: "Piso garantizado en caídas de mercado" },
          { v: <CountUp end={12} suffix="%" />, l: "Cap de rendimiento anual potencial" }].
          map((s, i) =>
          <Anim key={i} delay={i * 0.1}>
              <div className="text-center min-w-[170px]">
                <div className="text-4xl font-bold text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</div>
                <div className={`text-[11px] ${t.textMuted} mt-1.5 tracking-wide max-w-[170px]`}>{s.l}</div>
              </div>
            </Anim>
          )}
        </div>
      </section>

      {/* ─── PAIN POINTS ───────────────────────────────────── */}
      <section className="py-24 px-6" aria-labelledby="pain-heading">
        <div className="max-w-4xl mx-auto text-center">
          <Anim>
            <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">¿Te identificas?</p>
            <h2
              id="pain-heading"
              className={`text-3xl sm:text-4xl font-normal leading-tight ${t.text} mb-4`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
              
              Si trabajas duro pero <em className="text-[#1d9fa9]">no tienes un plan</em>,<br />tu esfuerzo se pierde cada día
            </h2>
            <p className={`text-base ${t.textMuted} max-w-xl mx-auto mb-2`}>
              La inflación se come tus ahorros. El banco te paga 0.05%. Y si mañana no puedes trabajar, ¿quién mantiene a tu familia?
            </p>
            <div className="w-16 h-[3px] bg-gradient-to-r from-transparent via-[#1d9fa9] to-transparent mx-auto mt-5 mb-10 rounded" />
          </Anim>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {[
            "Trabajas como independiente (1099) y no tienes 401(k), pensión ni beneficios de retiro",
            "Tu cuenta de ahorro genera menos del 0.3% de interés — la inflación te roba poder adquisitivo cada año",
            "Si algo te ocurre mañana, tu familia queda sin ingresos, sin plan, sin protección",
            "Tienes ITIN y piensas que no calificas para productos financieros formales en EE.UU.",
            "Tu hipoteca te tomará 30 años pagarla — pero con un IUL podrías liquidarla en 15-20",
            "Has escuchado del IUL pero no sabes si es real — te lo explicamos con números, no con promesas"].
            map((p, i) =>
            <Anim key={i} delay={i * 0.06}>
                <div className={`flex gap-3 p-4 ${t.dangerBg} border border-red-500/10 rounded-xl`}>
                  <span className="text-red-500 text-lg font-bold shrink-0 leading-relaxed">✕</span>
                  <p className={`text-sm ${t.textMid} leading-relaxed`}>{p}</p>
                </div>
              </Anim>
            )}
          </div>

          <Anim delay={0.4}>
            <p
              className={`text-2xl font-normal ${t.text} mt-12 italic leading-relaxed`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
              
              "El mejor momento para empezar fue ayer.<br />
              El segundo mejor es{" "}
              <span className="font-bold bg-gradient-to-r from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">hoy</span>."
            </p>
          </Anim>
        </div>
      </section>

      {/* ─── BENEFITS ──────────────────────────────────────── */}
      <section id="beneficios" className={`${t.bg2} py-24 px-6`} aria-labelledby="benefits-heading">
        <div className="max-w-7xl mx-auto">
          <Anim>
            <div className="text-center mb-14">
              <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Soluciones reales</p>
              <h2 id="benefits-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                Un solo instrumento,{" "}
                <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">
                  múltiples beneficios
                </span>
              </h2>
              <p className={`text-base ${t.textMuted} max-w-xl mx-auto mt-4 leading-relaxed`}>
                El IUL se adapta a tus necesidades específicas: protección, ahorro, retiro o todo a la vez.
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((n, i) =>
            <Anim key={i} delay={i * 0.08}>
                <article className={`${t.card} border rounded-2xl p-8 h-full flex flex-col backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1d9fa9]/30`}>
                  <span className="text-4xl mb-4" role="img" aria-hidden="true">{n.icon}</span>
                  <h3 className={`text-xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>{n.title}</h3>
                  <p className={`text-sm ${t.textMuted} leading-relaxed flex-1`}>{n.desc}</p>
                  <div className="mt-4 w-9 h-[3px] bg-gradient-to-r from-[#1d9fa9] to-transparent rounded" />
                </article>
              </Anim>
            )}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
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
              {STEPS.map((s, i) =>
              <Anim key={i} delay={i * 0.12}>
                  <div className="flex gap-7 mb-10 items-start">
                    <div className="shrink-0 w-20 h-20 flex items-center justify-center border-2 border-[#1d9fa9] rounded-2xl relative">
                      <span className="text-3xl font-light text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>{s.n}</span>
                      {i < STEPS.length - 1 &&
                    <div className="absolute -bottom-11 left-1/2 w-[2px] h-10 bg-gradient-to-b from-[#1d9fa9]/40 to-transparent rounded" />
                    }
                    </div>
                    <div className="pt-1.5">
                      <h3 className={`text-2xl font-semibold ${t.text} mb-2`} style={{ fontFamily: "'Playfair Display', serif" }}>{s.t}</h3>
                      <p className={`text-[15px] ${t.textMid} leading-relaxed max-w-lg`}>{s.d}</p>
                    </div>
                  </div>
                </Anim>
              )}
            </div>
            <Anim delay={0.3}>
              <div className="rounded-3xl overflow-hidden shadow-xl shadow-[#1d9fa9]/10 border border-[#1d9fa9]/10">
                <img
                  src={consultationImg}
                  alt="Asesor financiero en consulta con una familia latina"
                  className="w-full h-auto object-cover"
                  width={512}
                  height={320}
                  loading="lazy" />
                
              </div>
            </Anim>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ────────────────────────────────────── */}
      <section id="comparativa" className={`${t.bg2} py-24 px-6`} aria-labelledby="comparison-heading">
        <div className="max-w-4xl mx-auto">
          <Anim>
            <div className="text-center mb-12">
              <p className="text-xs tracking-[3px] text-red-500 uppercase font-bold mb-4">La verdad en números</p>
              <h2 id="comparison-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                Tu cuenta de banco <em className="text-red-500">no es suficiente</em>
              </h2>
              <p className={`text-base ${t.textMuted} max-w-xl mx-auto mt-4`}>
                Compara el rendimiento real de ahorrar en un banco vs un IUL con protección incluida.
              </p>
            </div>
          </Anim>

          {/* Bank vs IUL table */}
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
                  {BANK_VS_IUL.map((r, i) =>
                  <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                      <td className={`p-4 text-sm ${t.text} font-medium`}>{r.f}</td>
                      <td className={`p-4 text-sm ${t.textMuted} text-center`}>{r.b}</td>
                      <td className="p-4 text-sm text-[#1d9fa9] text-center font-semibold">{r.i}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className={`text-[11px] ${t.textMuted} italic`}>
              *Retiros mediante préstamos de la póliza pueden ser libres de impuestos cuando se estructuran correctamente. Consulte con su asesor fiscal.
            </p>
          </Anim>

          {/* Full comparison */}
          <Anim delay={0.2}>
            <h3 className={`text-2xl sm:text-3xl font-normal ${t.text} text-center mt-14 mb-8`} style={{ fontFamily: "'Playfair Display', serif" }}>
              IUL vs otras opciones:{" "}
              <span className="italic bg-gradient-to-r from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">comparación completa</span>
            </h3>
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[560px] ${t.divider} border rounded-xl overflow-hidden`} role="table" aria-label="Comparación completa de productos financieros">
                <thead>
                  <tr className={t.brandBg}>
                    {["Característica", "IUL", "Banco", "401(k)", "Term Life"].map((h, i) =>
                    <th key={i} className={`p-3 text-[10px] tracking-[1.5px] uppercase font-bold ${i === 1 ? "text-[#1d9fa9]" : t.textMuted} ${i > 0 ? "text-center" : "text-left"}`}>
                        {h}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {FULL_COMPARISON.map((r, i) =>
                  <tr key={i} className={`${t.divider} border-t ${i % 2 !== 0 ? t.brandBg : ""}`}>
                      <td className={`p-3 text-sm ${t.text}`}>{r.f}</td>
                      {[r.iul, r.bank, r.k, r.term].map((v, j) =>
                    <td key={j} className="p-3 text-center">
                          {v ? <CheckIcon className={j === 0 ? "text-[#1d9fa9] mx-auto" : `${t.textMid} mx-auto`} /> : <span className={`${t.textMuted} opacity-30`}>—</span>}
                        </td>
                    )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Anim>
        </div>
      </section>

      {/* ─── NICHE TABS ────────────────────────────────────── */}
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
            <div className="flex flex-wrap gap-2 justify-center mb-7" role="tablist" aria-label="Selecciona tu perfil">
              {TABS.map((item, i) =>
              <button
                key={i}
                onClick={() => setTab(i)}
                role="tab"
                aria-selected={tab === i}
                aria-controls={`tabpanel-${i}`}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition-all border ${
                tab === i ?
                "bg-[#1d9fa9]/10 border-[#1d9fa9] text-[#1d9fa9]" :
                `${t.divider} ${t.textMid} hover:border-[#1d9fa9]/30`}`
                }>
                
                  {item.t}
                </button>
              )}
            </div>

            <div
              id={`tabpanel-${tab}`}
              role="tabpanel"
              className={`${t.card} border rounded-2xl p-10 text-center backdrop-blur-xl`}>
              
              <h3 className="text-2xl font-semibold text-[#1d9fa9] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {TABS[tab].t}
              </h3>
              <p className={`text-[15px] ${t.textMid} leading-relaxed max-w-xl mx-auto`}>{TABS[tab].c}</p>
              <a
                href="#consulta"
                className="inline-block mt-7 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-3.5 rounded-lg font-bold no-underline hover:shadow-lg transition-all">
                
                Quiero mi plan personalizado →
              </a>
            </div>
          </Anim>
        </div>
      </section>

      {/* ─── TRANSPARENCY ──────────────────────────────────── */}
      <section className={`${t.bg2} py-24 px-6`} aria-labelledby="transparency-heading">
        <div className="max-w-5xl mx-auto">
          <Anim>
            <div className="text-center mb-12">
              <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Transparencia total</p>
              <h2 id="transparency-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                Lo que <em className="text-red-500">otros no te dicen</em>, nosotros sí
              </h2>
              <p className={`text-base ${t.textMuted} max-w-xl mx-auto mt-4`}>
                La confianza se construye con honestidad.
              </p>
            </div>
          </Anim>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Anim delay={0.1}>
              <div className={`${t.successBg} border border-[#1d9fa9]/15 rounded-2xl p-8 h-full`}>
                <h3 className="text-xl text-[#1d9fa9] mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <CheckIcon className="text-[#1d9fa9]" /> Lo que el IUL SÍ hace
                </h3>
                <ul className={`text-sm ${t.textMid} leading-loose space-y-1.5 list-none p-0`}>
                  {[
                  "Protege a tu familia de por vida con un beneficio por fallecimiento",
                  "Crece tu dinero vinculado al mercado con un piso de 0%",
                  "Te permite acceder a tu dinero sin penalidades",
                  "Ofrece riders de enfermedades graves que funcionan en vida",
                  "Acepta aplicantes con ITIN, no necesitas SSN",
                  "Primas flexibles que se adaptan a tu presupuesto"].
                  map((x, i) =>
                  <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-[#1d9fa9] font-bold shrink-0">✓</span>
                      <span>{x}</span>
                    </li>
                  )}
                </ul>
              </div>
            </Anim>
            <Anim delay={0.2}>
              <div className={`${t.dangerBg} border border-red-500/10 rounded-2xl p-8 h-full`}>
                <h3 className="text-xl text-red-500 mb-5 flex items-center gap-2.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                  ⚠ Lo que debes saber
                </h3>
                <ul className={`text-sm ${t.textMid} leading-loose space-y-1.5 list-none p-0`}>
                  {[
                  "Tiene costos internos que reducen el valor en los primeros años",
                  "El rendimiento tiene un techo (cap): típicamente entre 9.5% y 12%",
                  "No es una inversión directa en bolsa, es un seguro indexado",
                  "El crecimiento real se acelera después del año 5-7",
                  "No es ideal para todos: depende de tu horizonte e ingresos",
                  "Trabaja solo con un agente licenciado que muestre escenarios reales"].
                  map((x, i) =>
                  <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-red-500 font-bold shrink-0">!</span>
                      <span>{x}</span>
                    </li>
                  )}
                </ul>
              </div>
            </Anim>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────── */}
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
            {TESTIMONIALS.map((item, i) =>
            <Anim key={i} delay={i * 0.12}>
                <blockquote className={`${t.card} border rounded-2xl p-8 h-full flex flex-col backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg`}>
                  <span className="text-3xl text-[#1d9fa9] opacity-25 leading-none">"</span>
                  <p className={`text-sm ${t.textMid} leading-relaxed flex-1 italic my-3`}>"{item.text}"</p>
                  <div className="flex gap-0.5 mb-3 text-[#1d9fa9]">
                    {Array(item.stars).fill(0).map((_, j) => <StarIcon key={j} />)}
                  </div>
                  <cite className="not-italic flex items-center gap-3">
                    <img
                    src={item.img}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#1d9fa9]/20"
                    width={48}
                    height={48}
                    loading="lazy" />
                  
                    <div>
                      <div className={`text-base font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>{item.name}</div>
                      <div className={`text-xs ${t.textMuted} mt-0.5`}>{item.role}</div>
                    </div>
                  </cite>
                </blockquote>
              </Anim>
            )}
          </div>
        </div>
      </section>

      {/* ─── URGENCY ───────────────────────────────────────── */}
      <section className={`${t.bg2} py-20 px-6`} aria-label="Llamado a la acción">
        <Anim>
          <div className={`max-w-3xl mx-auto text-center ${t.brandBg} border-2 border-[#1d9fa9]/15 rounded-3xl p-12 sm:p-14 relative`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold">El tiempo es tu mayor activo</span>
            </div>
            <h2
              className={`text-2xl sm:text-[34px] font-normal ${t.text} leading-snug mb-5`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
              
              Cada año que esperas le cuesta a tu familia{" "}
              <strong className="bg-gradient-to-r from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_ease-in-out_infinite]">
                miles de dólares
              </strong>{" "}
              en crecimiento compuesto
            </h2>
            <p className={`text-[15px] ${t.textMid} leading-relaxed mb-4 max-w-xl mx-auto`}>
              Una persona que empieza con $250/mes a los <strong className={t.text}>30 años</strong> puede acumular más de <strong className="text-[#1d9fa9]">$200,000</strong> para su retiro. La misma persona que espera hasta los 40 acumula menos de la mitad.
            </p>
            <p className={`text-sm ${t.textMuted} mb-8 max-w-md mx-auto`}>
              Cada mes que pasa sin un plan es dinero que pierdes para siempre. El interés compuesto no espera.
            </p>
            <a
              href="#consulta"
              className="inline-block bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-10 py-4 rounded-xl font-bold text-base no-underline hover:shadow-xl hover:shadow-[#1d9fa9]/25 transition-all animate-[pulse_3s_infinite]">
              
              Comienza Hoy — Consulta 100% Gratis →
            </a>
          </div>
        </Anim>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <Anim>
            <div className="text-center mb-10">
              <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Preguntas frecuentes</p>
              <h2 id="faq-heading" className={`text-3xl sm:text-4xl font-normal ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                Tus dudas,{" "}
                <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">resueltas</span>
              </h2>
            </div>
          </Anim>

          <div role="region" aria-label="Preguntas frecuentes sobre IUL">
            {FAQS.map((f, i) =>
            <Anim key={i} delay={i * 0.04}>
                <div
                className={`mb-2.5 border rounded-xl overflow-hidden transition-all ${
                faqOpen === i ? "border-[#1d9fa9]/30 " + t.brandBg : t.divider}`
                }>
                
                  <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className={`w-full p-5 flex justify-between items-center bg-transparent border-none cursor-pointer text-left hover:${t.brandBg} rounded-xl transition-colors`}
                  aria-expanded={faqOpen === i}
                  aria-controls={`faq-answer-${i}`}>
                  
                    <span className={`text-[15px] font-semibold pr-4 transition-colors ${faqOpen === i ? "text-[#1d9fa9]" : t.text}`}>
                      {f.q}
                    </span>
                    <span className={`text-xl font-light text-[#1d9fa9] shrink-0 transition-transform ${faqOpen === i ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  <div
                  id={`faq-answer-${i}`}
                  role="region"
                  className="overflow-hidden transition-all duration-400"
                  style={{ maxHeight: faqOpen === i ? 280 : 0 }}>
                  
                    <p className={`px-5 pb-5 text-sm ${t.textMid} leading-relaxed`}>{f.a}</p>
                  </div>
                </div>
              </Anim>
            )}
          </div>
        </div>
      </section>

      {/* ─── LEAD FORM (Multi-Step Wizard) ──────────────── */}
      <section id="consulta" className={`${t.bg2} py-24 px-6`} aria-labelledby="form-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <Anim>
              <div>
                <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Da el primer paso</p>
                <h2
                  id="form-heading"
                  className={`text-3xl sm:text-4xl font-normal ${t.text} mb-6`}
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Tu consulta gratuita te espera
                </h2>
                <p className={`text-[15px] ${t.textMid} leading-relaxed mb-8`}>
                  Sin presión, sin compromiso. Solo una conversación honesta sobre tus metas, tu familia y cómo el IUL puede ayudarte. <strong className={t.text}>El 90% de nuestros clientes desearían haber empezado antes.</strong>
                </p>

                {["Consulta de 20-30 min por Zoom o WhatsApp", "Análisis personalizado de tu situación", "Proyección con números reales, sin promesas falsas", "Te explicamos todo en español, sin jerga financiera"].map((x, i) =>
                <div key={i} className="flex items-center gap-3 mb-3.5">
                    <CheckIcon className="text-[#1d9fa9]" />
                    <span className={`text-sm ${t.text}`}>{x}</span>
                  </div>
                )}

                <div className={`mt-7 p-5 ${t.brandBg} border border-[#1d9fa9]/15 rounded-xl`}>
                  <div className="text-xs text-[#1d9fa9] font-bold mb-1.5 tracking-wide">DOCUMENTOS ACEPTADOS</div>
                  <p className={`text-sm ${t.textMid}`}>Social Security • ITIN • Pasaporte • Matrícula Consular</p>
                </div>

                <div className="mt-7 rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={familyHomeImg}
                    alt="Familia latina en su nuevo hogar"
                    className="w-full h-48 object-cover"
                    width={512}
                    height={192}
                    loading="lazy" />
                </div>
              </div>
            </Anim>

            <Anim delay={0.15}>
              <div className={`${t.card} border rounded-2xl p-9 backdrop-blur-xl`}>
                {/* Form Title */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs tracking-[2px] text-[#1d9fa9] uppercase font-bold">Agenda tu llamada</span>
                  </div>
                  <h3 className={`text-2xl font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                    Recibe una consulta <span className="italic text-[#1d9fa9]">personalizada</span>
                  </h3>
                  <p className={`text-sm ${t.textMuted} mt-2`}>Completa estos pasos rápidos y un asesor te contactará.</p>
                </div>

                {formState !== "success" ? (
                  <>
                    {/* Progress bar */}
                    <div className="flex items-center gap-1.5 mb-6">
                      {[1,2,3,4,5].map((s) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#1d9fa9]" : dark ? "bg-white/10" : "bg-black/10"}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] ${t.textMuted} mb-5 text-center tracking-wide`}>Paso {step} de 5</p>

                    {/* Step container with transitions */}
                    <div className="relative overflow-hidden">
                      {/* Step 1: Interés */}
                      <div className={`transition-all duration-500 ease-out ${step === 1 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
                        <h3 className={`text-xl font-semibold ${t.text} mb-5 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                          ¿Qué te gustaría lograr con este plan?
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { value: "Proteger a mi familia", icon: "🛡️" },
                            { value: "Crear capital / ahorro", icon: "💰" },
                            { value: "Ahorro a largo plazo / retiro", icon: "📈" },
                            { value: "Protección por enfermedad", icon: "❤️" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { updateField("interes", opt.value); setStep(2); }}
                              className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition-all hover:border-[#1d9fa9] hover:shadow-md ${
                                form.interes === opt.value
                                  ? "border-[#1d9fa9] bg-[#1d9fa9]/10"
                                  : `${t.divider} ${dark ? "bg-white/[0.02]" : "bg-black/[0.01]"}`
                              }`}>
                              <span className="text-2xl">{opt.icon}</span>
                              <span className={`text-sm font-medium ${t.text}`}>{opt.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Step 2: Año de nacimiento */}
                      <div className={`transition-all duration-500 ease-out ${step === 2 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
                        <h3 className={`text-xl font-semibold ${t.text} mb-2 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                          ¿En qué año naciste?
                        </h3>
                        <p className={`text-sm ${t.textMuted} mb-6 text-center`}>Esto nos ayuda a calcular tu proyección personalizada.</p>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1940"
                          max="2007"
                          placeholder="Ej: 1985"
                          value={form.anio_nacimiento}
                          onChange={(e) => updateField("anio_nacimiento", e.target.value)}
                          className={`w-full p-4 ${t.input} border rounded-xl text-center text-2xl font-bold outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30`}
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        />
                        <div className="flex gap-3 mt-6">
                          <button type="button" onClick={() => setStep(1)} className={`flex-1 py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                            ← Atrás
                          </button>
                          <button
                            type="button"
                            disabled={!form.anio_nacimiento || parseInt(form.anio_nacimiento) < 1940 || parseInt(form.anio_nacimiento) > 2007}
                            onClick={() => setStep(3)}
                            className="flex-1 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                            Siguiente →
                          </button>
                        </div>
                      </div>

                      {/* Step 3: Ahorro semanal */}
                      <div className={`transition-all duration-500 ease-out ${step === 3 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
                        <h3 className={`text-xl font-semibold ${t.text} mb-2 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                          ¿Cuánto te gustaría ahorrar semanalmente?
                        </h3>
                        <p className={`text-sm ${t.textMuted} mb-6 text-center`}>Selecciona el monto que mejor se adapte a tu presupuesto.</p>
                        <div className="grid grid-cols-3 gap-3">
                          {["25", "50", "75", "100", "150", "200"].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => { updateField("ahorro_semanal", amt); setStep(4); }}
                              className={`p-4 rounded-xl border text-center cursor-pointer transition-all hover:border-[#1d9fa9] hover:shadow-md ${
                                form.ahorro_semanal === amt
                                  ? "border-[#1d9fa9] bg-[#1d9fa9]/10"
                                  : `${t.divider} ${dark ? "bg-white/[0.02]" : "bg-black/[0.01]"}`
                              }`}>
                              <div className="text-xl font-bold text-[#1d9fa9]" style={{ fontFamily: "'Playfair Display', serif" }}>${amt}</div>
                              <div className={`text-[10px] ${t.textMuted} mt-1`}>/semana</div>
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setStep(2)} className={`w-full mt-5 py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                          ← Atrás
                        </button>
                      </div>

                      {/* Step 4: Confirmación */}
                      <div className={`transition-all duration-500 ease-out ${step === 4 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
                        <div className="text-center">
                          <div className="text-5xl mb-5">🎯</div>
                          <h3 className={`text-xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>
                            Si calificas, ¿te gustaría ver tus números personalizados?
                          </h3>
                          <p className={`text-sm ${t.textMuted} mb-7 leading-relaxed`}>
                            Basado en tu perfil, podemos preparar una proyección real con cifras personalizadas para ti.
                          </p>
                          <div className="flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => setStep(5)}
                              className="w-full bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-4 rounded-xl font-bold text-base cursor-pointer hover:shadow-lg transition-all">
                              Sí, quiero ver mis números →
                            </button>
                            <button type="button" onClick={() => setStep(3)} className={`w-full py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                              ← Atrás
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Step 5: Datos de contacto */}
                      <div className={`transition-all duration-500 ease-out ${step === 5 ? "opacity-100 translate-x-0 max-h-[800px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
                        <form onSubmit={handleSubmit} noValidate>
                          <h3 className={`text-xl font-semibold ${t.text} mb-2 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                            ¡Último paso! Tus datos de contacto
                          </h3>
                          <p className={`text-sm ${t.textMuted} mb-6 text-center`}>Para enviarte tu proyección personalizada.</p>

                          {[
                            { n: "nombre" as const, l: "Nombre completo", ty: "text", p: "Tu nombre completo" },
                            { n: "telefono" as const, l: "Teléfono / WhatsApp", ty: "tel", p: "+1 (___) ___-____" },
                            { n: "email" as const, l: "Email", ty: "email", p: "tu@email.com" },
                          ].map((fi) => (
                            <div key={fi.n} className="mb-4">
                              <label htmlFor={fi.n} className={`block text-[11px] ${t.textMid} mb-1.5 tracking-wide uppercase font-bold`}>
                                {fi.l} <span className="text-red-400">*</span>
                              </label>
                              <input
                                id={fi.n}
                                name={fi.n}
                                type={fi.ty}
                                placeholder={fi.p}
                                required
                                autoComplete={fi.n === "nombre" ? "name" : fi.n === "telefono" ? "tel" : "email"}
                                value={form[fi.n]}
                                onChange={(e) => updateField(fi.n, e.target.value)}
                                className={`w-full p-3.5 ${t.input} border rounded-lg text-sm outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30`}
                              />
                            </div>
                          ))}

                          <button
                            type="submit"
                            disabled={formState === "loading"}
                            className="w-full bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-4 rounded-xl font-bold text-base tracking-wide cursor-pointer hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            {formState === "loading" ? "Enviando..." : formState === "error" ? "Reintentar →" : "Ver mis números personalizados →"}
                          </button>
                          {formState === "error" && (
                            <p className="text-xs text-red-500 mt-2 text-center">
                              Hubo un problema al enviar. Por favor intenta de nuevo.
                            </p>
                          )}
                          <button type="button" onClick={() => setStep(4)} className={`w-full mt-3 py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                            ← Atrás
                          </button>
                          <p className={`text-[11px] ${t.textMuted} mt-3 text-center`}>Tu información es 100% confidencial. Sin spam.</p>
                        </form>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ─── Pantalla Final de Conversión ─── */
                  <div className="text-center py-8 animate-[fadeUp_0.6s_ease]">
                    <div className="text-5xl mb-5">✅</div>
                    <h3 className={`text-2xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>
                      Perfecto. Tus datos fueron recibidos correctamente.
                    </h3>
                    <p className={`text-[15px] ${t.textMid} leading-relaxed mb-6`}>
                      Un asesor puede revisar tus cifras contigo <strong className="text-[#1d9fa9]">ahora mismo</strong>.
                    </p>
                    <div className={`${t.brandBg} border border-[#1d9fa9]/15 rounded-xl p-5 mb-5`}>
                      <p className={`text-sm ${t.textMid}`}>
                        📞 Te contactaremos en las próximas horas por <strong className={t.text}>WhatsApp o teléfono</strong> para agendar tu consulta gratuita.
                      </p>
                    </div>
                    <p className={`text-xs ${t.textMuted}`}>
                      Si prefieres, también puedes llamarnos directamente.
                    </p>
                  </div>
                )}
              </div>
            </Anim>
          </div>

          {/* ─── Contacto Directo ─── */}
          <Anim delay={0.25}>
            <div className={`mt-10 ${t.card} border rounded-2xl p-8 backdrop-blur-xl max-w-6xl mx-auto`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#1d9fa9]/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#1d9fa9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                      ¿Prefieres hablar directamente?
                    </h4>
                     <p className={`text-sm ${t.textMuted} mt-1`}>
                      Llámanos o escríbenos por WhatsApp. Lunes a viernes, 10:00 A.M. a 5:00 P.M.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <a href="tel:+17869562771" className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-6 py-3 rounded-xl font-bold text-sm no-underline hover:shadow-lg transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    Llamar ahora
                  </a>
                  <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] px-6 py-3 rounded-xl font-bold text-sm no-underline hover:bg-[#25D366]/10 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" aria-label="Llamado final">
        <Anim>
          <div className="max-w-2xl mx-auto">
            <h2
              className={`text-3xl sm:text-[44px] font-normal ${t.text} leading-tight mb-5`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
              
              Tu familia merece{" "}
              <strong className="italic bg-gradient-to-r from-[#28C4CF] via-[#1d9fa9] to-[#177D85] bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_ease-in-out_infinite]">
                un plan
              </strong>
            </h2>
            <p className={`text-base ${t.textMid} leading-relaxed mb-8`}>
              No importa si tienes SSN o ITIN. No importa si eres W-2 o 1099. Lo que importa es que hoy puedes dar el primer paso para proteger lo que más quieres.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3.5">
              <a href="#consulta" className="bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-9 py-4 rounded-lg font-bold no-underline hover:shadow-xl transition-all text-center">
                Agenda tu Consulta Gratis
              </a>
              <a href="tel:+17869562771" className="border-2 border-[#1d9fa9] text-[#1d9fa9] px-8 py-3.5 rounded-lg font-semibold no-underline hover:bg-[#1d9fa9]/10 transition-all inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Llámanos ahora
              </a>
            </div>
          </div>
        </Anim>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer className={`${t.bg2} ${t.divider} border-t py-14 px-6`} role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo.png" alt="Platinium Insurance Group" className="h-9 w-auto" width={36} height={36} loading="lazy" />
                <div>
                  <div className="text-[15px] font-bold text-[#1d9fa9]">PLATINIUM INSURANCE</div>
                  <div className={`text-[9px] tracking-[3px] ${t.textMuted} uppercase`}>GROUP</div>
                </div>
              </div>
              <p className={`text-sm ${t.textMuted} leading-relaxed max-w-xs`}>
                Asesoría financiera especializada en la comunidad hispana de Miami. Protección, retiro y crecimiento financiero con transparencia.
              </p>
            </div>
            {/* Navegación */}
            <nav aria-label="Navegación del pie de página">
              <h4 className="text-[11px] tracking-[2px] text-[#1d9fa9] uppercase mb-4 font-bold">Navegación</h4>
              {NAV_LINKS.map((l) =>
              <a key={l.href} href={l.href} className={`block text-sm ${t.textMuted} no-underline mb-2.5 hover:text-[#1d9fa9] transition-colors`}>
                  {l.label}
                </a>
              )}
            </nav>

            {/* Horarios */}
            <div>
              <h4 className="text-[11px] tracking-[2px] text-[#1d9fa9] uppercase mb-4 font-bold">🕒 Horarios de Atención</h4>
              <div className={`text-sm ${t.textMuted} leading-relaxed space-y-1`}>
                <p>Lunes a Viernes: 10:00 A.M. a 5:00 P.M.</p>
                <p>Sábado: Cerrado</p>
                <p>Domingo: Cerrado</p>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-[11px] tracking-[2px] text-[#1d9fa9] uppercase mb-4 font-bold">Contacto</h4>
              <div className={`text-sm ${t.textMuted} space-y-3`}>
                <a href="tel:+17869562771" className={`flex items-center gap-2.5 ${t.textMuted} no-underline hover:text-[#1d9fa9] transition-colors`}>
                  <Phone className="w-4 h-4 shrink-0 text-[#1d9fa9]" />
                  (786) 956-2771
                </a>
                <a href="https://wa.me/17866787863" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[#25D366] no-underline hover:opacity-80 transition-opacity">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  +1 (786) 678-7863
                </a>
                <a href="https://www.instagram.com/platiniuminsurancegroup" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2.5 ${t.textMuted} no-underline hover:text-[#E4405F] transition-colors`}>
                  <Instagram className="w-4 h-4 shrink-0 text-[#E4405F]" />
                  @platiniuminsurancegroup
                </a>
              </div>
            </div>

            {/* Oficinas */}
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
          </div>

          <div className={`${t.divider} border-t pt-5 mt-10 flex flex-col sm:flex-row justify-between gap-3`}>
            <p className={`text-[11px] ${t.textMuted} opacity-60`}>© {new Date().getFullYear()} Platinium Insurance Group. Todos los derechos reservados.</p>
            <p className={`text-[10px] ${t.textMuted} opacity-50 max-w-lg`}>
              Descargo: Este sitio es informativo y no constituye asesoría financiera, legal o fiscal. El IUL es un producto de seguro, no una inversión regulada por la SEC. Consulte con un asesor licenciado.
            </p>
          </div>
        </div>
      </footer>
    </div>);

}
import testimonial1Img from "@/assets/testimonial-1.jpg";
import testimonial2Img from "@/assets/testimonial-2.jpg";
import testimonial3Img from "@/assets/testimonial-3.jpg";

export const FAQS = [
  {
    q: "¿Qué es exactamente un Seguro de Vida Universal Indexado (IUL)?",
    a: "Es un seguro de vida permanente que combina protección financiera para tu familia con un componente de acumulación de valor en efectivo. Tu dinero crece vinculado a índices del mercado como el S&P 500, pero con una protección: si el mercado baja, tu dinero no pierde valor gracias a un piso garantizado. Es protección + crecimiento en un solo instrumento.",
  },
  {
    q: "¿El IUL es una inversión o un seguro?",
    a: "Técnicamente es un seguro de vida, no un producto de inversión regulado por la SEC. Tu dinero no se invierte directamente en la bolsa de valores. En su lugar, gana intereses basados en el rendimiento de índices bursátiles, con límites de ganancia (cap) y un piso que protege contra pérdidas.",
  },
  {
    q: "¿Puedo aplicar si tengo ITIN y no tengo número de Seguro Social?",
    a: "Sí. Puedes aplicar con ITIN, pasaporte o matrícula consular, siempre que hayas declarado impuestos en los últimos años. Esto lo convierte en una herramienta accesible para inmigrantes que buscan protección y ahorro formal en Estados Unidos.",
  },
  {
    q: "¿Cuánto necesito para comenzar?",
    a: "Las primas son flexibles y se adaptan a tu presupuesto. Muchas familias comienzan con aportes desde $200 a $500 mensuales. Durante tu consulta gratuita, diseñamos un plan personalizado basado en tus ingresos, objetivos y situación familiar.",
  },
  {
    q: "¿El IUL es mejor que un 401(k)?",
    a: "Son herramientas diferentes que pueden complementarse. El 401(k) es excelente si tu empleador hace matching, pero tiene límites de contribución y penalidades por retiro anticipado. El IUL ofrece acceso a tu dinero sin penalidades mediante préstamos de la póliza, protección por fallecimiento y beneficios en vida.",
  },
  {
    q: "He escuchado que el IUL es una estafa, ¿es verdad?",
    a: "No es una estafa cuando se diseña y se explica correctamente. Las malas experiencias suelen venir de agentes que prometen rendimientos irreales o que no explican los costos. Por eso es crucial trabajar con un asesor licenciado que te muestre escenarios realistas y diseñe la póliza según tus necesidades reales.",
  },
  {
    q: "¿Qué pasa si necesito dinero por una emergencia médica?",
    a: "El IUL incluye riders para enfermedades crónicas, críticas y terminales. Si sufres un evento de salud grave, puedes acceder a un adelanto del beneficio por fallecimiento para cubrir gastos médicos o de manutención, sin esperar a que alguien fallezca.",
  },
  {
    q: "¿Cuánto tiempo tarda en acumularse el valor en efectivo?",
    a: "Los primeros años se enfocan en establecer la póliza. El crecimiento real se acelera a partir del año 5-7 gracias al interés compuesto. Por eso el IUL es una estrategia de mediano a largo plazo, ideal para personas que planifican su retiro con 15-30 años de anticipación.",
  },
];

export const BENEFITS = [
  { icon: "🏠", title: "Protección Familiar", desc: "Asegura el futuro de tu familia con un beneficio por fallecimiento que cubre hipoteca, deudas y nivel de vida. Tu legado, garantizado.", link: "/proteccion-familiar" },
  { icon: "📈", title: "Plan de Retiro", desc: "Construye tu jubilación con crecimiento indexado al mercado y acceso a tu dinero libre de impuestos mediante préstamos de la póliza.", link: "/proteccion-familiar" },
  { icon: "🏡", title: "Paga tu Hipoteca", desc: "Usa el valor acumulado para liquidar tu hipoteca en 15-20 años en vez de 30. Tu casa libre de deudas, más rápido.", link: "/seguro-de-vida-iul" },
  { icon: "❤️", title: "Beneficios en Vida", desc: "Riders para enfermedades crónicas, críticas y terminales. Accede a tu beneficio cuando más lo necesitas, sin esperar.", link: "/beneficios-en-vida" },
  { icon: "💼", title: "Negocio Familiar", desc: "Protege tu negocio y planifica la sucesión patrimonial. Ideal para dueños de restaurantes, construcción y comercio.", link: "/iul-emprendedores" },
  { icon: "🌎", title: "Acceso con ITIN", desc: "Aplica con ITIN, pasaporte o matrícula consular. Tu estatus migratorio no te impide proteger a tu familia.", link: "/seguro-vida-itin" },
];

export const STEPS = [
  { n: "01", t: "Consulta Gratuita", d: "Hablamos sobre tu situación, tus metas y tu familia. Sin presión, sin compromiso. Solo información clara y honesta." },
  { n: "02", t: "Diseño Personalizado", d: "Creamos un plan a tu medida: prima flexible, riders opcionales, estrategia de indexación ajustada a tu perfil y horizonte temporal." },
  { n: "03", t: "Activación y Protección", d: "Desde el día uno tu familia está protegida. Tu póliza comienza a acumular valor en efectivo con el poder del interés compuesto." },
  { n: "04", t: "Acompañamiento Continuo", d: "Revisamos tu póliza periódicamente, ajustamos contribuciones y te educamos para que aproveches cada beneficio de tu IUL." },
];

export const BANK_VS_IUL = [
  { f: "Rendimiento anual", b: "0.05% – 0.30%", i: "0% – 12% (con protección)" },
  { f: "Protección ante caídas", b: "FDIC hasta $250K", i: "Piso garantizado 0%" },
  { f: "Beneficio por fallecimiento", b: "Ninguno", i: "Desde $250,000+" },
  { f: "Beneficios en vida", b: "Ninguno", i: "Enfermedades graves, crónicas, terminales" },
  { f: "Ventaja fiscal", b: "Intereses gravables", i: "Crecimiento diferido, retiros libres*" },
  { f: "Después de 20 años ($250/mes)", b: "≈ $61,500", i: "≈ $150,000 – $200,000+" },
];

export const FULL_COMPARISON = [
  { f: "Protección por fallecimiento", iul: true, bank: false, k: false, term: true },
  { f: "Crecimiento vinculado al mercado", iul: true, bank: false, k: true, term: false },
  { f: "Protección contra pérdidas (piso 0%)", iul: true, bank: true, k: false, term: false },
  { f: "Acceso al dinero sin penalidades", iul: true, bank: true, k: false, term: false },
  { f: "Beneficios fiscales en retiros", iul: true, bank: false, k: false, term: false },
  { f: "Riders de enfermedades graves", iul: true, bank: false, k: false, term: false },
  { f: "Cobertura de por vida", iul: true, bank: false, k: false, term: false },
  { f: "Aplicable con ITIN", iul: true, bank: true, k: false, term: true },
];

export const TABS = [
  { t: "Latinos con ITIN", c: "Si declaras impuestos con ITIN, ya tienes lo que necesitas para comenzar. El IUL es una de las pocas herramientas financieras formales accesibles sin SSN. Transforma tu disciplina tributaria en un plan de retiro y protección real para tu familia." },
  { t: "Dueños de Negocio", c: "Tu restaurante, tu negocio de limpieza, tu empresa de construcción: son el sustento de tu familia. El IUL protege ese legado con un beneficio por fallecimiento, riders para enfermedades graves y un plan de retiro que crece mientras tú trabajas." },
  { t: "Transportistas 1099", c: "Sin 401(k), sin beneficios de empleador, sin red de seguridad. Como conductor independiente, el IUL te da lo que nadie más te ofrece: protección permanente, ahorro para retiro y acceso a tu dinero cuando lo necesites." },
  { t: "Familias Jóvenes", c: "Entre más joven comiences, más poderoso es el interés compuesto. Protege a tus hijos desde hoy, asegura la casa familiar y construye un colchón financiero que crece con el tiempo." },
];

export const TESTIMONIALS = [
  { name: "María González", role: "Emprendedora", text: "Cuando llegué a este país solo tenía mi ITIN y muchos sueños. Nunca pensé que podría tener un plan de retiro formal. Hoy, después de 4 años con mi IUL, tengo protección para mi familia y un fondo que crece cada año. Mi asesora me explicó todo en español, sin letra pequeña.", stars: 5, img: testimonial1Img },
  { name: "Carlos Mendoza", role: "Transportista 1099", text: "Como camionero independiente no tenía 401(k) ni beneficios. Mi agente me explicó todo con números reales, sin promesas falsas. Ahora tengo un plan que protege a mis hijos y me está ayudando a pagar mi casa más rápido. Mi única queja es no haber empezado antes.", stars: 5, img: testimonial2Img },
  { name: "Ana Patricia Ruiz", role: "Dueña de restaurante", text: "Al principio pensé que era demasiado bueno para ser verdad. Pero me mostraron los costos, los límites y los escenarios reales. Entendí que no es mágico, es una herramienta poderosa cuando se usa bien. Hoy duermo tranquila sabiendo que mi familia está protegida pase lo que pase.", stars: 5, img: testimonial3Img },
];

export const SERVICE_PAGES = [
  { label: "¿Qué es el IUL?", href: "/seguro-de-vida-iul" },
  { label: "Protección y Retiro", href: "/proteccion-familiar" },
  { label: "Seguro con ITIN", href: "/seguro-vida-itin" },
  { label: "IUL vs 401(k)", href: "/iul-vs-401k" },
  { label: "Plan para Hijos", href: "/iul-para-hijos" },
  { label: "Para Emprendedores", href: "/iul-emprendedores" },
  { label: "Sin Examen Médico", href: "/seguro-vida-sin-examen-medico" },
  { label: "Beneficios en Vida", href: "/beneficios-en-vida" },
  { label: "Cotiza tu Plan", href: "/cotizacion-iul" },
];

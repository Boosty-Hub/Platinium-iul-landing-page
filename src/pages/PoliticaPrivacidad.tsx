import { Layout } from "@/components/shared/Layout";
import { SEOHead, DOMAIN } from "@/components/shared/SEOHead";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Política de Privacidad — Platinium Insurance Group",
    url: `${DOMAIN}/politica-de-privacidad`,
    description: "Política de privacidad de Platinium Insurance Group. Conoce cómo recopilamos, usamos y protegemos tu información personal.",
  },
];

export default function PoliticaPrivacidad() {
  return (
    <Layout>
      {({ t }) => (
        <>
          <SEOHead
            title="Política de Privacidad — Platinium Insurance Group"
            description="Conoce cómo Platinium Insurance Group recopila, usa y protege tu información personal. Cumplimos con las leyes de privacidad de EE.UU."
            keywords="política de privacidad, protección de datos, seguro de vida, Platinium Insurance Group"
            canonical={`${DOMAIN}/politica-de-privacidad`}
            jsonLd={jsonLd}
          />

          <main className="pt-28 pb-20 px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Política de Privacidad
              </h1>
              <p className={`text-sm ${t.textMuted} mb-10`}>Última actualización: 10 de abril de 2026</p>

              <div className={`prose prose-sm max-w-none ${t.textMid} space-y-8 [&_h2]:text-[#1d9fa9] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-[#1d9fa9] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1`}>

                <p>
                  En <strong>Platinium Insurance Group</strong> ("nosotros", "nuestro" o "la Compañía"), respetamos y protegemos la privacidad de quienes visitan nuestro sitio web{" "}
                  <a href={DOMAIN}>{DOMAIN.replace("https://", "")}</a> y utilizan nuestros servicios. Esta Política de Privacidad describe qué información recopilamos, cómo la usamos, con quién la compartimos y cuáles son tus derechos.
                </p>
                <p>
                  Al utilizar nuestro sitio web o enviar información a través de nuestros formularios, aceptas las prácticas descritas en esta política.
                </p>

                <h2>1. Información que Recopilamos</h2>
                <h3>Información proporcionada por ti</h3>
                <p>Cuando completas nuestro formulario de cotización o nos contactas, podemos recopilar:</p>
                <ul>
                  <li>Nombre completo</li>
                  <li>Número de teléfono</li>
                  <li>Correo electrónico</li>
                  <li>Año de nacimiento</li>
                  <li>Género</li>
                  <li>Capacidad de ahorro semanal</li>
                  <li>Interés específico en nuestros servicios (jubilación, protección familiar, etc.)</li>
                </ul>

                <h3>Información recopilada automáticamente</h3>
                <p>Cuando visitas nuestro sitio, podemos recopilar automáticamente:</p>
                <ul>
                  <li>Dirección IP</li>
                  <li>Tipo de navegador y dispositivo (User Agent)</li>
                  <li>Página de referencia (referrer)</li>
                  <li>Parámetros de campaña (UTM source, medium, campaign, content, term)</li>
                  <li>Datos de cookies y tecnologías de rastreo similares</li>
                </ul>

                <h2>2. Cómo Usamos tu Información</h2>
                <p>Utilizamos la información recopilada para los siguientes propósitos:</p>
                <ul>
                  <li>Contactarte para ofrecerte una cotización personalizada de seguro de vida IUL</li>
                  <li>Responder a tus consultas y solicitudes</li>
                  <li>Gestionar tu información en nuestro sistema de relación con clientes (CRM)</li>
                  <li>Mejorar nuestros servicios y la experiencia del usuario en el sitio web</li>
                  <li>Enviar comunicaciones relacionadas con los servicios que solicitaste</li>
                  <li>Cumplir con obligaciones legales y regulatorias</li>
                </ul>

                <h2>3. Cookies y Tecnologías de Rastreo</h2>
                <p>
                  Nuestro sitio utiliza <strong>Google Tag Manager (GTM)</strong> y tecnologías similares para analizar el tráfico del sitio y mejorar nuestros servicios de marketing. Estas herramientas pueden almacenar cookies en tu dispositivo.
                </p>
                <p>Las cookies nos ayudan a:</p>
                <ul>
                  <li>Entender cómo los visitantes interactúan con nuestro sitio</li>
                  <li>Medir la efectividad de nuestras campañas publicitarias</li>
                  <li>Recordar tus preferencias (como la aceptación de cookies)</li>
                </ul>
                <p>
                  Puedes desactivar las cookies en la configuración de tu navegador, aunque esto puede afectar la funcionalidad del sitio.
                </p>

                <h2>4. Compartición de Información con Terceros</h2>
                <p>No vendemos tu información personal. Podemos compartir tu información únicamente con:</p>
                <ul>
                  <li><strong>Compañías aseguradoras</strong> asociadas, para procesar tu solicitud de cotización o póliza</li>
                  <li><strong>Proveedores de servicios</strong> que nos ayudan a operar nuestro negocio (CRM, herramientas de comunicación, servicios de hosting)</li>
                  <li><strong>Autoridades legales</strong>, cuando sea requerido por ley o para proteger nuestros derechos legales</li>
                </ul>
                <p>Todos nuestros proveedores están obligados a proteger tu información conforme a estándares de seguridad adecuados.</p>

                <h2>5. Tus Derechos de Privacidad</h2>
                <p>Dependiendo de tu estado de residencia, puedes tener derecho a:</p>
                <ul>
                  <li><strong>Acceder</strong> a la información personal que tenemos sobre ti</li>
                  <li><strong>Solicitar la eliminación</strong> de tu información personal</li>
                  <li><strong>Optar por no participar</strong> (opt-out) en la venta o compartición de tus datos personales</li>
                  <li><strong>Corregir</strong> información inexacta</li>
                  <li><strong>No ser discriminado</strong> por ejercer tus derechos de privacidad</li>
                </ul>
                <p>
                  Si resides en California, la <strong>Ley de Privacidad del Consumidor de California (CCPA/CPRA)</strong> te otorga derechos adicionales. Puedes ejercer estos derechos contactándonos a{" "}
                  <a href="mailto:info@platiniuminsuranceusa.com">info@platiniuminsuranceusa.com</a>.
                </p>

                <h2>6. Seguridad de Datos</h2>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas razonables para proteger tu información personal contra acceso no autorizado, pérdida, alteración o divulgación. Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
                </p>

                <h2>7. Menores de Edad</h2>
                <p>
                  Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información personal de menores. Si crees que hemos recopilado datos de un menor, contáctanos para que podamos eliminarlos.
                </p>

                <h2>8. Cambios a Esta Política</h2>
                <p>
                  Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio será publicado en esta página con la fecha de última actualización. Te recomendamos revisarla regularmente.
                </p>

                <h2>9. Contacto</h2>
                <p>Si tienes preguntas sobre esta Política de Privacidad o deseas ejercer tus derechos, puedes contactarnos:</p>
                <ul>
                  <li><strong>Platinium Insurance Group</strong></li>
                  <li>5775 Waterford District Dr #170, Miami, FL 33126</li>
                  <li>Teléfono: <a href="tel:+16893082809">(689) 308-2809</a></li>
                  <li>Email: <a href="mailto:info@platiniuminsuranceusa.com">info@platiniuminsuranceusa.com</a></li>
                </ul>
              </div>
            </div>
          </main>
        </>
      )}
    </Layout>
  );
}

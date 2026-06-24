// ════════════════════════════════════════════════════════════════════════════
// Cotización — helpers compartidos para cotización de póliza IUL.
// Usado por: send-cotizacion, preview-cotizacion, cotizacion-sweep.
// ════════════════════════════════════════════════════════════════════════════
import { adminClient, getIntegracion } from "./integraciones.ts";

type Admin = ReturnType<typeof adminClient>;

// ── pickMonto ─────────────────────────────────────────────────────────────────
// ahorro_semanal es USD semanal ("25", "50", "75", "100" o número custom).
// Convierte a mensual (×4.3333), luego aproxima al monto más cercano del catálogo.
const MONTOS = [50, 100, 150, 200, 300, 400] as const;

export function pickMonto(ahorroSemanal: string | null | undefined): number {
  const weekly = parseFloat(ahorroSemanal ?? "");
  if (!Number.isFinite(weekly) || weekly <= 0) return 100;
  const monthly = weekly * 4.3333;
  // Nearest: minimiza |monthly - monto|
  let best = MONTOS[0];
  let bestDiff = Math.abs(monthly - MONTOS[0]);
  for (const m of MONTOS) {
    const d = Math.abs(monthly - m);
    if (d < bestDiff) { best = m; bestDiff = d; }
  }
  return best;
}

// ── edadCotiz ─────────────────────────────────────────────────────────────────
// Calcula edad a partir del año de nacimiento, con clamp [18, 55].
export function edadCotiz(anio: number | null | undefined): number | null {
  if (anio == null) return null;
  const y = Number(anio);
  if (!Number.isFinite(y) || y < 1900) return null;
  const edad = new Date().getFullYear() - y;
  if (edad < 18) return 18;
  if (edad > 55) return 55;
  return edad;
}

// ── generoNorm ────────────────────────────────────────────────────────────────
export function generoNorm(g: string | null | undefined): "MASCULINO" | "FEMENINO" | null {
  if (!g) return null;
  const u = g.trim().toUpperCase();
  if (u === "MASCULINO" || u === "M") return "MASCULINO";
  if (u === "FEMENINO" || u === "F") return "FEMENINO";
  return null;
}

// ── getCotizacionRow ──────────────────────────────────────────────────────────
export async function getCotizacionRow(
  admin: Admin,
  genero: "MASCULINO" | "FEMENINO",
  edad: number,
  monto: number,
) {
  const { data, error } = await admin
    .from("cotizaciones")
    .select("*")
    .eq("genero", genero)
    .eq("edad", edad)
    .eq("monto", monto)
    .maybeSingle();
  if (error) throw new Error(`getCotizacionRow: ${error.message}`);
  return data as CotizacionRow | null;
}

export interface CotizacionRow {
  genero: string;
  edad: number;
  monto: number;
  acum_10: number;
  acum_20: number;
  critica: number;
  cronica: number;
  terminal: number;
  alzheimer: number;
  beneficio_fallecimiento: number;
  db_65: number;
}

// ── fmt ───────────────────────────────────────────────────────────────────────
// USD sin decimales: $1,234
export function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "$0";
  const r = Math.round(n);
  return "$" + r.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ── buildCotizacionEmail ──────────────────────────────────────────────────────
// Renderiza el html_email de docs/cotizacion.html como TS template string.
// El markup es 100% inline CSS, tabla-based (Gmail/Outlook compatible).
export interface EmailOpts {
  logoPlatinium: string;
  logoNlg?: string | null;
  hoy: string;
}

export interface LeadForEmail {
  nombre: string;
  email: string;
  telefono: string;
  edad: number;
}

export function buildCotizacionEmail(
  lead: LeadForEmail,
  q: CotizacionRow,
  opts: EmailOpts,
): string {
  const { logoPlatinium, logoNlg, hoy } = opts;
  const { nombre, email, telefono, edad } = lead;
  const inicial = (nombre || "?")[0].toUpperCase();

  // Calcular valores de columna
  const mensual = q.monto;
  const fallecimiento = q.beneficio_fallecimiento;
  const acum10 = q.acum_10;
  const acum20 = q.acum_20;
  const terminal = q.terminal;
  const cronica = q.cronica;
  const critica = q.critica;
  const alzheimer = q.alzheimer;
  const edad10 = edad + 10;
  const edad20 = edad + 20;

  // Escalar barras: acum20 (mayor) ≈ 90px, acum10 proporcional, mínimo 30px
  const maxVal = Math.max(acum10, acum20, 1);
  const barH1 = Math.max(30, Math.round((acum10 / maxVal) * 90));
  const barH2 = Math.max(30, Math.round((acum20 / maxVal) * 90));

  // Línea del NLG logo — omitir <img> si no hay URL
  const nlgImgHtml = logoNlg
    ? `<img src="${logoNlg}" height="30" alt="National Life Group" style="display:block;height:30px;"/>`
    : `<span style="font-size:11px;color:rgba(255,255,255,0.45);">National Life Group®</span>`;

  // prettier-ignore
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu Cotización – ${nombre}</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F6F7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F6F7;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ═══ HEADER ═══ -->
  <tr>
    <td style="background:linear-gradient(135deg,#0B1A1E,#0E3A42);border-radius:16px 16px 0 0;padding:28px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <img src="${logoPlatinium}" height="42" alt="Platinium Insurance Group" style="display:block;height:42px;width:auto;margin-bottom:14px;"/>
            <p style="margin:0 0 4px;font-family:Georgia,serif;color:#ffffff;font-size:20px;font-weight:bold;line-height:1.25;">
              Mis <span style="color:#1d9fa9;">Beneficios de Seguro de Vida</span> Planificados
            </p>
            <p style="margin:0;color:#94B3BB;font-size:11px;font-weight:300;">Ilustración personalizada preparada exclusivamente para usted</p>
          </td>
          <td align="right" valign="middle" style="padding-left:20px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:rgba(29,159,169,0.2);border:1px solid rgba(29,159,169,0.4);border-radius:12px;padding:10px 18px;text-align:center;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#ffffff;line-height:1;">${fmt(mensual)}</p>
                  <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#94B3BB;">Prima Mensual</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ CLIENTE ═══ -->
  <tr>
    <td style="background:#F0F6F7;border-left:1px solid rgba(29,159,169,0.15);border-right:1px solid rgba(29,159,169,0.15);padding:14px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40" style="vertical-align:middle;">
                  <div style="width:40px;height:40px;background:linear-gradient(135deg,#0E6B73,#1d9fa9);border-radius:50%;text-align:center;line-height:40px;color:white;font-family:Georgia,serif;font-size:17px;font-weight:bold;">${inicial}</div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <p style="margin:0;font-size:15px;font-weight:bold;color:#0E6B73;">${nombre}</p>
                  <p style="margin:2px 0 0;font-size:11px;color:#7A9BA3;">${email} · ${telefono} · Edad ${edad}</p>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#7A9BA3;">Preparado el</p>
            <p style="margin:2px 0 0;font-size:12px;font-weight:bold;color:#4A6B73;">${hoy}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ CARD 1: FALLECIMIENTO ═══ -->
  <tr>
    <td style="padding:0 0 2px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:1px solid rgba(29,159,169,0.15);border-right:1px solid rgba(29,159,169,0.15);">
        <tr>
          <td width="72" style="background:#0B1A1E;padding:16px 8px;text-align:center;vertical-align:middle;border-right:none;">
            <p style="margin:0;font-size:9px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.8);line-height:1.4;">Muerte<br>Prematura</p>
          </td>
          <td style="background:#F5EEFF;padding:16px 20px;vertical-align:middle;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#0E6B73;">Si Fallezco Mañana...</p>
            <p style="margin:0;font-size:12px;color:#4A6B73;font-weight:300;">Las personas que he elegido recibirán:</p>
          </td>
          <td style="background:linear-gradient(135deg,#0B1A1E,#0E3A42);padding:16px 20px;text-align:center;vertical-align:middle;min-width:160px;">
            <p style="margin:0 0 4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#94B3BB;">Beneficio por Fallecimiento</p>
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1d9fa9;line-height:1;">${fmt(fallecimiento)}</p>
            <p style="margin:4px 0 0;font-size:10px;color:#94B3BB;">Suma Global</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ CARD 2: EFECTIVO ═══ -->
  <tr>
    <td style="padding:2px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:1px solid rgba(29,159,169,0.15);border-right:1px solid rgba(29,159,169,0.15);">
        <tr>
          <td width="72" style="background:#0E6B73;padding:16px 8px;text-align:center;vertical-align:middle;">
            <p style="margin:0;font-size:9px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.9);line-height:1.4;">Años de<br>Vida Larga</p>
          </td>
          <td style="background:#F0F6F7;padding:16px 20px;vertical-align:middle;width:200px;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#0E6B73;">Si Necesito Efectivo...</p>
            <p style="margin:0;font-size:12px;color:#4A6B73;font-weight:300;">Puedo tomar un préstamo o retiro del Valor en Efectivo de mi póliza.</p>
          </td>
          <td style="background:#F0F6F7;padding:14px 20px;vertical-align:top;border-left:1px solid rgba(29,159,169,0.12);">
            <p style="margin:0 0 12px;font-size:10px;color:#7A9BA3;text-align:center;padding-bottom:8px;border-bottom:1px solid rgba(29,159,169,0.15);">El Valor en Efectivo proyectado de mi póliza es:</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr valign="bottom">
                <td align="center" style="padding:0 12px;">
                  <p style="margin:0 0 5px;font-size:12px;font-weight:bold;color:#0E6B73;white-space:nowrap;">${fmt(acum10)}</p>
                  <div style="width:50px;height:${barH1}px;background:linear-gradient(180deg,#1d9fa9,#0E6B73);border-radius:4px 4px 0 0;"></div>
                  <p style="margin:5px 0 0;font-size:10px;color:#7A9BA3;">Edad ${edad10}</p>
                </td>
                <td align="center" style="padding:0 12px;">
                  <p style="margin:0 0 5px;font-size:12px;font-weight:bold;color:#0E6B73;white-space:nowrap;">${fmt(acum20)}</p>
                  <div style="width:50px;height:${barH2}px;background:linear-gradient(180deg,#1d9fa9,#0E6B73);border-radius:4px 4px 0 0;"></div>
                  <p style="margin:5px 0 0;font-size:10px;color:#7A9BA3;">Edad ${edad20}</p>
                </td>
              </tr>
            </table>
            <p style="margin:8px 0 0;font-size:10px;color:#7A9BA3;text-align:center;border-top:1px solid rgba(29,159,169,0.12);padding-top:6px;">Edad Alcanzada</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ CARD 3: ENFERMEDAD ═══ -->
  <tr>
    <td style="padding:2px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:1px solid rgba(29,159,169,0.15);border-right:1px solid rgba(29,159,169,0.15);">
        <tr>
          <td width="72" style="background:#0B3A40;padding:16px 8px;text-align:center;vertical-align:middle;">
            <p style="margin:0;font-size:9px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.9);line-height:1.4;">Me<br>Enfermo</p>
          </td>
          <td style="background:#F0F6F7;padding:16px 20px;vertical-align:middle;width:180px;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:17px;font-weight:bold;color:#0E6B73;">Si Me Enfermo...</p>
            <p style="margin:0;font-size:12px;color:#4A6B73;font-weight:300;">Puedo acceder a una parte de mi Beneficio por Fallecimiento.</p>
          </td>
          <td style="background:#F0F6F7;padding:14px 20px;vertical-align:top;border-left:1px solid rgba(29,159,169,0.12);">
            <p style="margin:0 0 10px;font-size:10px;color:#7A9BA3;text-align:center;">Valores proyectados del Rider de Beneficios Anticipados a los 65 años:</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr style="border-bottom:1px solid rgba(29,159,169,0.12);">
                <td style="font-size:11px;color:#4A6B73;padding:5px 0;">Beneficio por Enfermedad Terminal:</td>
                <td align="right" style="font-size:11px;font-weight:bold;color:#0E6B73;padding:5px 0;white-space:nowrap;">${fmt(terminal)} Suma Global</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(29,159,169,0.12);">
                <td style="font-size:11px;color:#4A6B73;padding:5px 0;">Beneficio por Enfermedad Crónica:</td>
                <td align="right" style="font-size:11px;font-weight:bold;color:#0E6B73;padding:5px 0;white-space:nowrap;">${fmt(cronica)} Por Mes</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(29,159,169,0.12);background:rgba(29,159,169,0.05);">
                <td style="font-size:11px;color:#4A6B73;padding:5px 3px;">Beneficio por Enfermedad Crítica:</td>
                <td align="right" style="font-size:11px;font-weight:bold;color:#0E6B73;padding:5px 0;white-space:nowrap;">Hasta ${fmt(critica)} S.G.</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(29,159,169,0.12);background:rgba(29,159,169,0.05);">
                <td style="font-size:11px;color:#4A6B73;padding:5px 3px;">Beneficio por Lesión Crítica:</td>
                <td align="right" style="font-size:11px;font-weight:bold;color:#0E6B73;padding:5px 0;white-space:nowrap;">Hasta ${fmt(critica)} S.G.</td>
              </tr>
              <tr>
                <td style="font-size:11px;color:#4A6B73;padding:5px 0;">Beneficio por Alzheimer:</td>
                <td align="right" style="font-size:11px;font-weight:bold;color:#0E6B73;padding:5px 0;white-space:nowrap;">${fmt(alzheimer)} Suma Global</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ NOTA PIE ═══ -->
  <tr>
    <td style="background:#ffffff;border:1px solid rgba(29,159,169,0.15);border-top:none;padding:14px 32px;">
      <p style="margin:0;font-size:9.5px;color:#7A9BA3;line-height:1.6;">
        ¹ Los préstamos y retiros pueden reducir el beneficio por fallecimiento y el valor en efectivo.<br>
        ² Los valores del Rider de Beneficios Anticipados son proyecciones y no están garantizados.<br>
        Esta ilustración no es un contrato. Los valores son solo para fines informativos.
      </p>
    </td>
  </tr>

  <!-- ═══ SPACER ═══ -->
  <tr><td style="height:16px;"></td></tr>

  <!-- ═══ EMPRESA ═══ -->
  <tr>
    <td style="background:#0B1A1E;border-radius:16px 16px 0 0;padding:24px 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#1d9fa9;font-weight:bold;">Por qué confiar en nosotros</p>
            <p style="margin:0 0 6px;font-family:Georgia,serif;color:#ffffff;font-size:20px;font-weight:bold;">Nuestra Historia &amp; <span style="color:#1d9fa9;font-style:italic;">Fortaleza</span></p>
            <p style="margin:0 0 12px;font-size:11.5px;color:#94B3BB;line-height:1.5;">Respaldados por uno de los grupos de seguros más confiables de América — cumpliendo promesas desde 1848.</p>
            <table cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid #1d9fa9;background:rgba(29,159,169,0.08);border-radius:0 8px 8px 0;">
              <tr><td style="padding:10px 14px;font-size:11.5px;color:#E4EEF0;line-height:1.5;">
                En <strong style="color:#1d9fa9;">National Life Group</strong>, somos una empresa con propósito. Desde 1848 brindamos estabilidad y tranquilidad — en buenos y malos tiempos.
              </td></tr>
            </table>
          </td>
          <td align="right" valign="top" style="padding-left:24px;white-space:nowrap;">
            <img src="${logoPlatinium}" height="38" alt="Platinium" style="display:block;height:38px;margin-bottom:10px;"/>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-left:auto;"><tr><td style="height:1px;background:rgba(29,159,169,0.3);width:120px;"></td></tr></table>
            <div style="margin-top:10px;">
              ${nlgImgHtml}
              <p style="margin:4px 0 0;font-size:8.5px;color:rgba(255,255,255,0.35);text-align:right;">Powered by National Life Group®</p>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ STATS ═══ -->
  <tr>
    <td style="background:#0F2229;padding:18px 32px;">
      <p style="margin:0 0 14px;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#1d9fa9;font-weight:bold;">Solidez Financiera (2024)</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="33%" style="text-align:center;padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0 0 3px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1d9fa9;">$57B</p>
                <p style="margin:0;font-size:9px;color:#94B3BB;text-transform:uppercase;letter-spacing:0.5px;">Total de Activos</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="text-align:center;padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0 0 3px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1d9fa9;">$3.9B</p>
                <p style="margin:0;font-size:9px;color:#94B3BB;text-transform:uppercase;letter-spacing:0.5px;">Beneficios Cumplidos</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="text-align:center;padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0 0 3px;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#1d9fa9;">$635M</p>
                <p style="margin:0;font-size:9px;color:#94B3BB;text-transform:uppercase;letter-spacing:0.5px;">Nuevas Primas</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ RATINGS ═══ -->
  <tr>
    <td style="background:#0F2229;padding:0 32px 18px;">
      <p style="margin:0 0 14px;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#1d9fa9;font-weight:bold;">Calificaciones Independientes</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="33%" style="padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1d9fa9;">A+</p>
                <p style="margin:3px 0 0;font-size:10px;font-weight:bold;color:white;">A.M. Best</p>
                <p style="margin:2px 0 0;font-size:9px;color:#94B3BB;">Superior · 2.º de 16</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1d9fa9;">A+</p>
                <p style="margin:3px 0 0;font-size:10px;font-weight:bold;color:white;">Standard &amp; Poor's</p>
                <p style="margin:2px 0 0;font-size:9px;color:#94B3BB;">Sólida · 5.º de 21</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 6px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,34,41,0.8);border:1px solid rgba(29,159,169,0.2);border-radius:10px;">
              <tr><td style="padding:12px 8px;text-align:center;">
                <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1d9fa9;">A1</p>
                <p style="margin:3px 0 0;font-size:10px;font-weight:bold;color:white;">Moody's</p>
                <p style="margin:2px 0 0;font-size:9px;color:#94B3BB;">Buena · 5.º de 21</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ═══ FOOTER ═══ -->
  <tr>
    <td style="background:#0B1A1E;border-top:2px solid rgba(29,159,169,0.3);border-radius:0 0 16px 16px;padding:16px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin:0;font-size:12px;font-weight:bold;color:white;">Platinium Insurance Group</p>
            <p style="margin:3px 0 0;font-size:11px;color:#94B3BB;">
              <a href="https://platiniuminsuranceusa.com" style="color:#1d9fa9;text-decoration:none;">platiniuminsuranceusa.com</a>
              &nbsp;·&nbsp; +16893082809
            </p>
          </td>
          <td align="right" valign="middle">
            <p style="margin:0;font-size:9px;color:rgba(148,179,187,0.5);text-align:right;line-height:1.5;max-width:240px;">
              Calificaciones al 31 dic. 2024. Las garantías dependen de la capacidad de pago de la compañía emisora.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── sendCotizacion ────────────────────────────────────────────────────────────
// Carga el lead, valida, obtiene la fila de cotización, construye y envía el email
// via Resend. Registra cotizacion_enviada_at y cotizacion_monto en leads.
// La API key de Resend NUNCA se devuelve en la respuesta.

export interface SendResult {
  ok: boolean;
  monto?: number;
  to?: string;
  error?: string;
}

export async function sendCotizacion(
  admin: Admin,
  lead_id: string,
  montoOverride?: number,
): Promise<SendResult> {
  // 1) Cargar lead
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, nombre, email, telefono, genero, anio_nacimiento, ahorro_semanal")
    .eq("id", lead_id)
    .maybeSingle();
  if (leadErr) return { ok: false, error: `Error al cargar lead: ${leadErr.message}` };
  if (!lead) return { ok: false, error: "Lead no encontrado" };

  // 2) Calcular perfil
  const genero = generoNorm(lead.genero);
  const edad = edadCotiz(lead.anio_nacimiento);
  const monto = montoOverride != null ? montoOverride : pickMonto(lead.ahorro_semanal);

  // 3) Validar campos mínimos
  if (!genero) return { ok: false, error: "Género del lead no válido (esperado Masculino/Femenino)" };
  if (edad == null) return { ok: false, error: "Año de nacimiento del lead no válido" };
  if (!lead.email) return { ok: false, error: "Lead sin email" };

  // 4) Obtener fila de cotización
  const q = await getCotizacionRow(admin, genero, edad, monto);
  if (!q) return { ok: false, error: `Sin tabla para ese perfil (${genero}, edad ${edad}, $${monto})` };

  // 5) Leer config de Resend
  const resend = await getIntegracion(admin, "resend").catch(() => null);
  if (!resend?.activo || !resend.config?.api_key) {
    return { ok: false, error: "Resend no configurado" };
  }
  const { api_key, from_email, from_name, reply_to, logo_platinium, logo_nlg } = resend.config;
  if (!from_email) return { ok: false, error: "Resend: falta from_email en config" };

  // 6) Construir email
  const hoy = new Date().toLocaleDateString("es-US", { year: "numeric", month: "long", day: "numeric" });
  const html = buildCotizacionEmail(
    { nombre: lead.nombre, email: lead.email, telefono: lead.telefono ?? "", edad },
    q,
    { logoPlatinium: logo_platinium ?? "", logoNlg: logo_nlg ?? null, hoy },
  );

  // 7) Enviar via Resend
  const from = from_name ? `${from_name} <${from_email}>` : from_email;
  const body: Record<string, unknown> = {
    from,
    to: [lead.email],
    subject: "Tu cotización personalizada — Platinium IUL",
    html,
  };
  if (reply_to) body.reply_to = reply_to;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${txt.slice(0, 200)}` };
  }

  // 8) Registrar en leads
  await admin
    .from("leads")
    .update({ cotizacion_enviada_at: new Date().toISOString(), cotizacion_monto: monto })
    .eq("id", lead_id);

  return { ok: true, monto, to: lead.email };
}

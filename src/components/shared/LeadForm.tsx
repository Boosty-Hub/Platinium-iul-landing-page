import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ThemeClasses } from "./theme";
import { CheckIcon, WhatsAppIcon } from "./Icons";
import familyHomeImg from "@/assets/family-home.jpg";
import { Anim } from "./Anim";

interface LeadFormData {
  nombre: string;
  telefono: string;
  email: string;
  interes: string;
  anio_nacimiento: string;
  ahorro_semanal: string;
}

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US/CA" },
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+57", flag: "🇨🇴", label: "CO" },
  { code: "+58", flag: "🇻🇪", label: "VE" },
  { code: "+54", flag: "🇦🇷", label: "AR" },
  { code: "+56", flag: "🇨🇱", label: "CL" },
  { code: "+51", flag: "🇵🇪", label: "PE" },
  { code: "+593", flag: "🇪🇨", label: "EC" },
  { code: "+502", flag: "🇬🇹", label: "GT" },
  { code: "+503", flag: "🇸🇻", label: "SV" },
  { code: "+504", flag: "🇭🇳", label: "HN" },
  { code: "+505", flag: "🇳🇮", label: "NI" },
  { code: "+506", flag: "🇨🇷", label: "CR" },
  { code: "+507", flag: "🇵🇦", label: "PA" },
  { code: "+53", flag: "🇨🇺", label: "CU" },
  { code: "+1809", flag: "🇩🇴", label: "DO" },
  { code: "+55", flag: "🇧🇷", label: "BR" },
];

const MIN_LOCAL_DIGITS: Record<string, number> = {
  "+1": 10, "+52": 10, "+57": 10, "+58": 10, "+54": 10,
  "+56": 9, "+51": 9, "+593": 9, "+502": 8, "+503": 8,
  "+504": 8, "+505": 8, "+506": 8, "+507": 8, "+53": 8,
  "+1809": 10, "+55": 11,
};

function formatPhoneDisplay(digits: string, countryCode: string): string {
  if (countryCode === "+1" || countryCode === "+1809") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return digits;
}

function validatePhone(rawPhone: string, countryCode: string): { valid: boolean; fullNumber: string; error?: string } {
  const digits = rawPhone.replace(/\D/g, "");
  const minDigits = MIN_LOCAL_DIGITS[countryCode] || 8;
  if (digits.length < minDigits) {
    return { valid: false, fullNumber: "", error: `El número debe tener al menos ${minDigits} dígitos` };
  }
  if (digits.length > 15) {
    return { valid: false, fullNumber: "", error: "El número es demasiado largo" };
  }
  const fullNumber = `${countryCode}${digits}`;
  return { valid: true, fullNumber };
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

async function submitLead(data: LeadFormData, formLoadedAt: number): Promise<{ ok: boolean; leadId?: string }> {
  try {
    const utms = getUTMParams();
    const res = await supabase.functions.invoke("submit-lead", {
      body: {
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email,
        interes: data.interes || "",
        anio_nacimiento: data.anio_nacimiento || null,
        ahorro_semanal: data.ahorro_semanal || null,
        notas: `Año nacimiento: ${data.anio_nacimiento || "N/A"} | Ahorro semanal: $${data.ahorro_semanal || "N/A"}`,
        referrer: document.referrer || "direct",
        fuente: window.location.pathname,
        form_loaded_at: formLoadedAt,
        ...utms,
      },
    });
    if (res.error) {
      console.error("Error en submit-lead:", res.error);
      return { ok: false };
    }
    const result = res.data as { ok: boolean; lead_id?: string };
    return { ok: result.ok, leadId: result.lead_id };
  } catch (err) {
    console.error("Error en submitLead:", err);
    return { ok: false };
  }
}

interface LeadFormProps {
  t: ThemeClasses;
  dark: boolean;
  defaultInteres?: string;
  showSidebar?: boolean;
  inline?: boolean;
  sidebarContent?: React.ReactNode;
}

export function LeadForm({ t, dark, defaultInteres = "", showSidebar = true, inline = false, sidebarContent }: LeadFormProps) {
  const [form, setForm] = useState<LeadFormData>({
    nombre: "",
    telefono: "",
    email: "",
    interes: defaultInteres,
    anio_nacimiento: "",
    ahorro_semanal: "",
  });
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneError, setPhoneError] = useState("");
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [step, setStep] = useState(defaultInteres ? 2 : 1);
  const [honeypot, setHoneypot] = useState("");
  const formLoadedAt = useRef(Date.now());

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formState === "loading") return;
      if (honeypot) { setFormState("success"); return; }
      const elapsed = Date.now() - formLoadedAt.current;
      if (elapsed < 3000) { setFormState("success"); return; }
      const phoneValidation = validatePhone(form.telefono, countryCode);
      if (!phoneValidation.valid) { setPhoneError(phoneValidation.error || "Número inválido"); return; }
      setPhoneError("");
      if (!form.email.includes("@") || !form.email.includes(".")) { alert("Por favor ingresa un email válido."); return; }
      const sanitized: LeadFormData = {
        nombre: form.nombre.trim().slice(0, 100),
        telefono: phoneValidation.fullNumber.slice(0, 20),
        email: form.email.trim().toLowerCase().slice(0, 100),
        interes: form.interes.slice(0, 50),
        anio_nacimiento: form.anio_nacimiento,
        ahorro_semanal: form.ahorro_semanal,
      };
      setFormState("loading");
      const result = await submitLead(sanitized, formLoadedAt.current);
      setFormState(result.ok ? "success" : "error");
    },
    [form, formState, honeypot, countryCode]
  );

  const updateField = useCallback((field: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Selection button styles
  const selBtnBase = "w-full p-3 sm:p-4 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition-all duration-300";
  const selBtnText = dark ? "text-white" : "text-[#0B1A1E]";
  const selBtnIdle = `bg-[#1d9fa9]/10 ${selBtnText} border-[#1d9fa9]/30 hover:shadow-[0_0_20px_rgba(29,159,169,0.35)] hover:border-[#1d9fa9]/60 hover:bg-[#1d9fa9]/20`;
  const selBtnActive = `bg-[#1d9fa9]/25 ${selBtnText} border-[#1d9fa9] shadow-[0_0_25px_rgba(29,159,169,0.4)]`;

  const amtBtnBase = "p-4 rounded-xl border text-center cursor-pointer transition-all duration-300";
  const amtBtnIdle = `bg-[#1d9fa9]/10 ${selBtnText} border-[#1d9fa9]/30 hover:shadow-[0_0_20px_rgba(29,159,169,0.35)] hover:border-[#1d9fa9]/60 hover:bg-[#1d9fa9]/20`;
  const amtBtnActive = `bg-[#1d9fa9]/25 ${selBtnText} border-[#1d9fa9] shadow-[0_0_25px_rgba(29,159,169,0.4)]`;

  const formCard = (
    <div className={`${t.card} border rounded-2xl p-5 sm:p-9 backdrop-blur-xl`}>
      <div className="text-center mb-4 sm:mb-6">
        <h3 className={`text-xl sm:text-2xl font-semibold ${t.text}`} style={{ fontFamily: "'Playfair Display', serif" }}>
          ¡Cotiza tu IUL <span className="italic text-[#1d9fa9]">Gratis</span> ahora!
        </h3>
        <p className={`text-sm ${t.textMuted} mt-1.5`}>Completa el formulario</p>
      </div>

      {formState !== "success" ? (
        <>
          <div className="flex items-center gap-1.5 mb-4 sm:mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#1d9fa9]" : dark ? "bg-white/10" : "bg-black/10"}`} />
            ))}
          </div>
          <p className={`text-[11px] ${t.textMuted} mb-4 sm:mb-5 text-center tracking-wide`}>Paso {step} de 5</p>

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
                    onClick={() => updateField("interes", opt.value)}
                    className={`${selBtnBase} ${form.interes === opt.value ? selBtnActive : selBtnIdle}`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.value}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!form.interes}
                onClick={() => setStep(2)}
                className="w-full mt-5 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>

            {/* Step 2: Año de nacimiento */}
            <div className={`transition-all duration-500 ease-out ${step === 2 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
              <h3 className={`text-xl font-semibold ${t.text} mb-6 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                ¿En qué año naciste?
              </h3>
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
                <button type="button" onClick={() => setStep(defaultInteres ? 2 : 1)} className={`flex-1 py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                  ← Atrás
                </button>
                <button
                  type="button"
                  disabled={!form.anio_nacimiento || parseInt(form.anio_nacimiento) < 1940 || parseInt(form.anio_nacimiento) > 2007}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>

            {/* Step 3: Ahorro semanal */}
            <div className={`transition-all duration-500 ease-out ${step === 3 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
              <h3 className={`text-xl font-semibold ${t.text} mb-6 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                ¿Cuánto te gustaría ahorrar semanalmente?
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["25", "50", "75", "100", "150", "200"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => updateField("ahorro_semanal", amt)}
                    className={`${amtBtnBase} ${form.ahorro_semanal === amt ? amtBtnActive : amtBtnIdle}`}
                  >
                    <div className={`text-xl font-bold ${dark ? "text-white" : "text-[#0B1A1E]"}`} style={{ fontFamily: "'Playfair Display', serif" }}>${amt}</div>
                    <div className={`text-[10px] mt-1 ${dark ? "text-white/60" : "text-[#0B1A1E]/50"}`}>/semana</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setStep(2)} className={`flex-1 py-3 rounded-xl border ${t.divider} ${t.textMid} font-semibold text-sm cursor-pointer transition-all hover:border-[#1d9fa9]`}>
                  ← Atrás
                </button>
                <button
                  type="button"
                  disabled={!form.ahorro_semanal}
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>

            {/* Step 4: Confirmación */}
            <div className={`transition-all duration-500 ease-out ${step === 4 ? "opacity-100 translate-x-0 max-h-[600px]" : "opacity-0 absolute inset-0 pointer-events-none translate-x-8 max-h-0"}`}>
              <div className="text-center">
                <div className="text-5xl mb-5">🎯</div>
                <h3 className={`text-xl font-semibold ${t.text} mb-7`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  Si calificas, ¿te gustaría ver tus números personalizados?
                </h3>
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={() => setStep(5)} className="w-full bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-4 rounded-xl font-bold text-base cursor-pointer hover:shadow-lg transition-all">
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
                <h3 className={`text-xl font-semibold ${t.text} mb-6 text-center`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  ¡Último paso! Tus datos de contacto
                </h3>

                <div className="mb-4">
                  <label htmlFor={inline ? "nombre-hero" : "nombre"} className={`block text-[11px] ${t.textMid} mb-1.5 tracking-wide uppercase font-bold`}>
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={inline ? "nombre-hero" : "nombre"}
                    name="nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    required
                    autoComplete="name"
                    value={form.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                    className={`w-full p-3.5 ${t.input} border rounded-lg text-sm outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30`}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor={inline ? "telefono-hero" : "telefono"} className={`block text-[11px] ${t.textMid} mb-1.5 tracking-wide uppercase font-bold`}>
                    Teléfono / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => { setCountryCode(e.target.value); setPhoneError(""); }}
                      className={`w-[110px] shrink-0 p-3.5 ${t.input} border rounded-lg text-sm outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30 appearance-none cursor-pointer`}
                      aria-label="Código de país"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id={inline ? "telefono-hero" : "telefono"}
                      name="telefono"
                      type="tel"
                      inputMode="numeric"
                      placeholder={countryCode === "+1" || countryCode === "+1809" ? "(305) 555-1234" : "Número de teléfono"}
                      required
                      autoComplete="tel-national"
                      value={form.telefono}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 15);
                        const display = formatPhoneDisplay(raw, countryCode);
                        updateField("telefono", display);
                        setPhoneError("");
                      }}
                      className={`flex-1 p-3.5 ${t.input} border rounded-lg text-sm outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30 ${phoneError ? "border-red-400" : ""}`}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-red-400 mt-1.5">{phoneError}</p>}
                </div>

                <div className="mb-4">
                  <label htmlFor={inline ? "email-hero" : "email"} className={`block text-[11px] ${t.textMid} mb-1.5 tracking-wide uppercase font-bold`}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={inline ? "email-hero" : "email"}
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`w-full p-3.5 ${t.input} border rounded-lg text-sm outline-none transition-colors focus:border-[#1d9fa9] focus:ring-1 focus:ring-[#1d9fa9]/30`}
                  />
                </div>

                <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="website_url">Website</label>
                  <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="w-full bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white py-4 rounded-xl font-bold text-base tracking-wide cursor-pointer hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formState === "loading" ? "Enviando..." : formState === "error" ? "Reintentar →" : "Ver mis números personalizados →"}
                </button>
                {formState === "error" && (
                  <p className="text-xs text-red-500 mt-2 text-center">Hubo un problema al enviar. Por favor intenta de nuevo.</p>
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
        <div className="text-center py-8 animate-[fadeUp_0.6s_ease]">
          <div className="text-5xl mb-5">✅</div>
          <h3 className={`text-2xl font-semibold ${t.text} mb-3`} style={{ fontFamily: "'Playfair Display', serif" }}>
            ¡Gracias por completar el formulario!
          </h3>
          <p className={`text-[15px] ${t.textMid} leading-relaxed mb-6`}>
            Estamos generando su cotización en PDF, atienda nuestra llamada para confirmar los datos telefónicamente.
          </p>
          <p className={`text-sm ${t.textMuted} mb-5`}>
            O si desea recibir aún más rápido su presupuesto:
          </p>
          <a
            href="tel:+16893082809"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-[#1d9fa9] to-[#177D85] text-white px-8 py-4 rounded-xl font-bold text-base no-underline hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            Llamar Ahora
          </a>
        </div>
      )}
    </div>
  );

  if (inline) {
    return formCard;
  }

  const defaultSidebar = (
    <Anim delay={0.1}>
      <div>
        <h3 className={`text-2xl font-semibold ${t.text} mb-5`} style={{ fontFamily: "'Playfair Display', serif" }}>
          ¿Qué incluye tu consulta?
        </h3>
        {[
          "Consulta de 20-30 min por Zoom o WhatsApp",
          "Análisis personalizado de tu situación",
          "Proyección con números reales, sin promesas falsas",
          "Te explicamos todo en español, sin jerga financiera",
        ].map((x, i) => (
          <div key={i} className="flex items-center gap-3 mb-3.5">
            <CheckIcon className="text-[#1d9fa9]" />
            <span className={`text-sm ${t.text}`}>{x}</span>
          </div>
        ))}
        <div className={`mt-7 p-5 ${t.brandBg} border border-[#1d9fa9]/15 rounded-xl`}>
          <div className="text-xs text-[#1d9fa9] font-bold mb-1.5 tracking-wide">DOCUMENTOS ACEPTADOS</div>
          <p className={`text-sm ${t.textMid}`}>Social Security • ITIN • Pasaporte • Matrícula Consular</p>
        </div>
        <div className="mt-7 rounded-2xl overflow-hidden shadow-lg">
          <img src={familyHomeImg} alt="Familia latina en su nuevo hogar" className="w-full h-48 object-cover" width={512} height={192} loading="lazy" />
        </div>
      </div>
    </Anim>
  );

  const sidebar = sidebarContent ? <Anim delay={0.1}>{sidebarContent}</Anim> : defaultSidebar;

  return (
    <section id="consulta" className={`${t.bg2} py-24 px-6`} aria-labelledby="form-heading">
      <div className="max-w-6xl mx-auto">
        <Anim>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[3px] text-[#1d9fa9] uppercase font-bold mb-4">Sin compromiso</p>
            <h2
              id="form-heading"
              className={`text-3xl sm:text-4xl font-normal ${t.text}`}
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Agenda tu{" "}
              <span className="font-bold italic bg-gradient-to-br from-[#28C4CF] to-[#177D85] bg-clip-text text-transparent">
                consulta gratuita
              </span>
            </h2>
          </div>
        </Anim>

        <div className={`grid ${showSidebar ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"} gap-8 items-start`}>
          {showSidebar && sidebar}
          <Anim delay={0.15}>
            {formCard}
          </Anim>
        </div>
      </div>
    </section>
  );
}

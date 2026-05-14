// Resumen humano del origen de un lead a partir de UTMs / clickIDs / referrer.

export type LeadOriginInput = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  fuente?: string | null;
};

export type LeadOrigin = {
  channel: string;
  campaign: string | null;
  detail: string | null;
  /** tailwind classes for badge bg/text */
  badgeClass: string;
  /** dot/icon color (hex) */
  color: string;
  icon: string;
  isPaid: boolean;
};

const norm = (v?: string | null) => (v || "").toString().trim().toLowerCase();

function shortReferrer(ref?: string | null): string | null {
  if (!ref) return null;
  try {
    const u = new URL(ref);
    const host = u.hostname.replace(/^www\./, "");
    if (
      host.includes("platiniuminsuranceusa") ||
      host.includes("lovable") ||
      host === "localhost"
    ) {
      return null;
    }
    return host;
  } catch {
    return ref.length > 40 ? ref.slice(0, 40) + "…" : ref;
  }
}

export function getLeadOrigin(lead: LeadOriginInput): LeadOrigin {
  const src = norm(lead.utm_source);
  const med = norm(lead.utm_medium);
  const camp = lead.utm_campaign?.trim() || null;
  const content = lead.utm_content?.trim() || null;
  const term = lead.utm_term?.trim() || null;
  const ref = shortReferrer(lead.referrer);

  const detailParts = [content, term].filter(Boolean) as string[];
  const detail = detailParts.length ? detailParts.join(" · ") : null;

  // Meta / Facebook / Instagram
  if (
    lead.fbclid ||
    /facebook|fb|meta/.test(src) ||
    /instagram|ig/.test(src) ||
    /facebook|meta|instagram/.test(med)
  ) {
    const isIG = /instagram|ig/.test(src) || /instagram/.test(med);
    return {
      channel: isIG ? "Instagram Ads" : "Facebook Ads",
      campaign: camp,
      detail,
      badgeClass: "bg-[#1877F2]/15 text-[#5B9BFF] border border-[#1877F2]/30",
      color: "#1877F2",
      icon: isIG ? "📸" : "📘",
      isPaid: true,
    };
  }

  // Google Ads
  if (
    lead.gclid ||
    (/google|adwords/.test(src) && /(cpc|paid|ads)/.test(med))
  ) {
    return {
      channel: "Google Ads",
      campaign: camp,
      detail,
      badgeClass: "bg-[#4285F4]/15 text-[#7AAEFF] border border-[#4285F4]/30",
      color: "#4285F4",
      icon: "🅖",
      isPaid: true,
    };
  }

  // TikTok
  if (/tiktok/.test(src) || /tiktok/.test(med)) {
    return {
      channel: "TikTok Ads",
      campaign: camp,
      detail,
      badgeClass: "bg-[#FF0050]/15 text-[#FF6B95] border border-[#FF0050]/30",
      color: "#FF0050",
      icon: "🎵",
      isPaid: true,
    };
  }

  // YouTube
  if (/youtube|yt/.test(src)) {
    return {
      channel: "YouTube",
      campaign: camp,
      detail,
      badgeClass: "bg-[#FF0000]/15 text-[#FF7070] border border-[#FF0000]/30",
      color: "#FF0000",
      icon: "▶️",
      isPaid: /(cpc|paid|ads)/.test(med),
    };
  }

  // Email
  if (/email|newsletter/.test(med) || /mail/.test(src)) {
    return {
      channel: "Email",
      campaign: camp,
      detail,
      badgeClass: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
      color: "#a855f7",
      icon: "✉️",
      isPaid: false,
    };
  }

  // Orgánico
  if (/organic|seo/.test(med) || (/google|bing|duckduckgo/.test(src) && !lead.gclid)) {
    return {
      channel: "Búsqueda orgánica",
      campaign: camp || (src ? src.charAt(0).toUpperCase() + src.slice(1) : null),
      detail,
      badgeClass: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      color: "#10b981",
      icon: "🔍",
      isPaid: false,
    };
  }

  // UTM presente pero no encajó arriba
  if (src || med || camp) {
    return {
      channel: src ? `Campaña · ${src}` : "Campaña",
      campaign: camp,
      detail: detail || (med || null),
      badgeClass: "bg-[#1d9fa9]/15 text-[#5fd0d9] border border-[#1d9fa9]/30",
      color: "#1d9fa9",
      icon: "🎯",
      isPaid: /(cpc|paid|ads)/.test(med),
    };
  }

  // Referido
  if (ref) {
    return {
      channel: "Referido",
      campaign: ref,
      detail: null,
      badgeClass: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      color: "#f59e0b",
      icon: "🔗",
      isPaid: false,
    };
  }

  // Directo
  return {
    channel: "Directo",
    campaign: null,
    detail: null,
    badgeClass: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
    color: "#94a3b8",
    icon: "🌐",
    isPaid: false,
  };
}

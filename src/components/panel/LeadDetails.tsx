import { Lead } from "@/pages/FormPanel";

export function LeadDetails({ lead }: { lead: Lead }) {
  const items: { label: string; value: string | null | undefined }[] = [
    { label: "Interés", value: lead.interes },
    { label: "Año nacimiento", value: lead.anio_nacimiento ? String(lead.anio_nacimiento) : null },
    { label: "Género", value: lead.genero },
    { label: "Ahorro semanal", value: lead.ahorro_semanal ? `$${lead.ahorro_semanal}` : null },
    { label: "utm_source", value: lead.utm_source },
    { label: "utm_medium", value: lead.utm_medium },
    { label: "utm_campaign", value: lead.utm_campaign },
    { label: "utm_content", value: lead.utm_content },
    { label: "utm_term", value: lead.utm_term },
    { label: "gclid", value: lead.gclid },
    { label: "fbclid", value: lead.fbclid },
    { label: "Referrer", value: lead.referrer },
    { label: "Fuente", value: lead.fuente },
    { label: "User agent", value: lead.user_agent },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#6A8E98]">{it.label}</span>
          <span className="text-[#E4EEF0] break-all">{it.value || <span className="text-[#6A8E98]">—</span>}</span>
        </div>
      ))}
    </div>
  );
}

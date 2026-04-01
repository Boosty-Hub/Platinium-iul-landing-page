export function getThemeClasses(dark: boolean) {
  return dark
    ? {
        bg: "bg-[#1d9fa9]",
        bg2: "bg-[#178A93]",
        card: "bg-[#0E6B73]/60 border-white/15",
        text: "text-white",
        textMid: "text-[#E0F7FA]",
        textMuted: "text-[#B2EBF2]",
        nav: "bg-[#1d9fa9]/92",
        divider: "border-white/10",
        input: "bg-[#0D5F66] border-white/20 text-white",
        brandBg: "bg-white/[0.08]",
        dangerBg: "bg-red-500/[0.08]",
        successBg: "bg-white/[0.05]",
      }
    : {
        bg: "bg-[#FAFCFC]",
        bg2: "bg-[#F0F6F7]",
        card: "bg-white/90 border-[#1d9fa9]/10",
        text: "text-[#1A2E33]",
        textMid: "text-[#4A6B73]",
        textMuted: "text-[#7A9BA3]",
        nav: "bg-[#FAFCFC]/92",
        divider: "border-[#1d9fa9]/10",
        input: "bg-[#E8F4F6] border-[#1d9fa9]/30 text-[#1A2E33]",
        brandBg: "bg-[#1d9fa9]/[0.05]",
        dangerBg: "bg-red-500/[0.03]",
        successBg: "bg-[#1d9fa9]/[0.04]",
      };
}

export type ThemeClasses = ReturnType<typeof getThemeClasses>;

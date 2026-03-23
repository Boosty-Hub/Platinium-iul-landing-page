export function getThemeClasses(dark: boolean) {
  return dark
    ? {
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
        successBg: "bg-[#1d9fa9]/[0.05]",
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
        input: "bg-black/[0.02] border-[#1d9fa9]/20 text-[#1A2E33]",
        brandBg: "bg-[#1d9fa9]/[0.05]",
        dangerBg: "bg-red-500/[0.03]",
        successBg: "bg-[#1d9fa9]/[0.04]",
      };
}

export type ThemeClasses = ReturnType<typeof getThemeClasses>;

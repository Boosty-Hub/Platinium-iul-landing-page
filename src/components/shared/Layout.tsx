import { useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { getThemeClasses } from "./theme";

interface LayoutProps {
  children: (props: { t: ReturnType<typeof getThemeClasses>; dark: boolean }) => React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [dark, setDark] = useState(true);
  const t = getThemeClasses(dark);

  return (
    <div className={`${t.bg} ${t.text} min-h-screen transition-colors duration-300`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar t={t} dark={dark} setDark={setDark} />
      {children({ t, dark })}
      <Footer t={t} />
    </div>
  );
}

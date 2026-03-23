import { Link } from "react-router-dom";
import type { ThemeClasses } from "./theme";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  t: ThemeClasses;
}

export function Breadcrumbs({ items, t }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="pt-24 pb-4 px-6">
      <ol className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
        <li>
          <Link to="/" className={`${t.textMuted} no-underline hover:text-[#1d9fa9] transition-colors`}>
            Inicio
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={t.textMuted}>/</span>
            {item.href ? (
              <Link to={item.href} className={`${t.textMuted} no-underline hover:text-[#1d9fa9] transition-colors`}>
                {item.label}
              </Link>
            ) : (
              <span className="text-[#1d9fa9] font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

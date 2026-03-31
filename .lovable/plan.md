

# Fix: Mobile Layout & Text Visibility Issues

## Root Cause Analysis

After inspecting the live preview at 390x844, I found **two critical issues**:

### Issue 1: `App.css` has default Vite boilerplate styles
```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;        /* 32px padding on all sides — steals 64px on a 390px screen */
  text-align: center;
}
```
This adds 32px of padding on every side, constraining the actual content to ~326px and breaking layout assumptions. It also forces `text-align: center` globally. This is leftover from the default Vite template and needs to be removed entirely.

### Issue 2: Text color classes not rendering reliably
The mobile hero H1, form title ("¡Cotiza tu IUL Gratis ahora!"), step indicator ("Paso 1 de 5"), and step headings are all invisible — the text exists in the DOM but appears as white-on-white. The Tailwind dynamic classes like `${dark ? "text-[#E4EEF0]" : "text-[#1A2E33]"}` may not be generating correctly in the build. Inline `style={{ color }}` must be used consistently for all critical text.

---

## Changes

### 1. Clean `src/App.css`
Remove the entire `#root` block and the unused `.logo`, `.card`, `.read-the-docs` styles. Keep the file empty or delete it.

### 2. Fix text visibility in `src/components/shared/LeadForm.tsx`
Replace all Tailwind dynamic color classes on headings and labels with inline `style={{ color: dark ? "..." : "..." }}` to guarantee rendering:
- Form main title h3
- "Paso X de 5" text
- Each step's h3 heading (Steps 1–5)
- "Continuar →" button text (already white, should be fine)
- Subtitle text under form title

### 3. Fix text visibility in `src/pages/Index.tsx` mobile hero
Ensure all mobile hero text elements (badge, H1, subtitle, guarantee badges) use inline `style={{ color }}` instead of Tailwind dynamic classes. Also fix:
- **Mobile CTAs** ("Llamar" / "WhatsApp") — ensure visible below form
- **Offices section** — ensure text uses inline colors for labels
- Reduce excess vertical spacing between navbar and form on mobile

### 4. Scroll down sections
Quick pass to ensure no other section has the same invisible-text pattern (stats bar, pain points, etc.). Replace `${t.text}` / `${t.textMid}` / `${t.textMuted}` with inline styles where needed on headings.

---

## Files Modified
1. `src/App.css` — gutted (remove Vite defaults)
2. `src/components/shared/LeadForm.tsx` — inline color styles on all text
3. `src/pages/Index.tsx` — inline color styles on mobile hero + layout tightening


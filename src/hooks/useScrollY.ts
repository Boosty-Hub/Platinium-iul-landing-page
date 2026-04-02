import { useState, useEffect, useRef } from "react";

export function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

export function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        // Always show at very top
        if (currentY < 10) {
          setVisible(true);
        } else if (currentY < lastY.current - 5) {
          // Scrolling up (with 5px threshold)
          setVisible(true);
        } else if (currentY > lastY.current + 5) {
          // Scrolling down (with 5px threshold)
          setVisible(false);
        }
        lastY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}

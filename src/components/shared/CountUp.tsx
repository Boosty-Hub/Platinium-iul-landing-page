import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";

export function CountUp({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [c, setC] = useState(0);
  const [ref, v] = useInView();
  useEffect(() => {
    if (!v) return;
    let s = 0;
    const step = end / 125;
    const t = setInterval(() => {
      s += step;
      if (s >= end) {
        setC(end);
        clearInterval(t);
      } else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(t);
  }, [v, end]);
  return (
    <span ref={ref}>
      {prefix}
      {c.toLocaleString()}
      {suffix}
    </span>
  );
}

import { useEffect, useRef, useState } from "react";

export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 32; // px tolerance
      const isAtBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      setAtBottom(isAtBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = (smooth = true) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  return { ref, atBottom, scrollToBottom };
}

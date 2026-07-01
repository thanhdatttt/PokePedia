"use client";

import { useEffect, useState } from "react";

export function StepTransition({ children, stepKey }: { children: React.ReactNode; stepKey: string | number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [stepKey]);

  return (
    <div
      className={`transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
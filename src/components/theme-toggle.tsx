"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="press relative grid size-9 place-items-center rounded-xl text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      {/* Cross-fade icons (skill: contextual icon animation, no motion lib). */}
      <Sun
        className="size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{
          opacity: mounted && !isDark ? 1 : 0,
          transform: mounted && !isDark ? "scale(1)" : "scale(0.25)",
          filter: mounted && !isDark ? "blur(0)" : "blur(4px)",
          gridArea: "1 / 1",
        }}
      />
      <Moon
        className="size-4 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{
          opacity: mounted && isDark ? 1 : 0,
          transform: mounted && isDark ? "scale(1)" : "scale(0.25)",
          filter: mounted && isDark ? "blur(0)" : "blur(4px)",
          gridArea: "1 / 1",
        }}
      />
    </button>
  );
}

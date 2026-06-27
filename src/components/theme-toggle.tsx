"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes hydration guard: theme is unknown on the server, so we render
  // the resolved icon only after mount to avoid a hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Until mounted, the theme is unknown on both server and first client render,
  // so keep everything theme-independent to avoid a hydration mismatch.
  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted
    ? "Tema değiştir"
    : isDark
      ? "Açık temaya geç"
      : "Koyu temaya geç";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
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

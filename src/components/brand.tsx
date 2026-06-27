import { cn } from "@/lib/utils";

// Full MDP Integration Platform wordmark. The white source export came empty,
// so we ship both color variants and swap by theme (the file is monochrome).
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mdp-logo.svg"
        alt="MDP Integration Platform"
        className={cn("block dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mdp-logo-white.svg"
        alt="MDP Integration Platform"
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

// Just the integration emblem (wide ribbon), cropped via the measured bbox.
// currentColor lets it inherit text color, so it themes for free.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="24 124 299 88"
      className={cn("text-foreground", className)}
      role="img"
      aria-label="MDP"
    >
      <g
        transform="translate(0,350) scale(0.1,-0.1)"
        fill="currentColor"
        stroke="none"
      >
        <path d="M663 2193 c-14 -16 -62 -95 -107 -178 -89 -163 -129 -236 -214 -389 -60 -110 -67 -149 -31 -178 20 -17 70 -18 836 -16 l816 3 161 290 161 290 274 3 273 2 -35 -62 c-19 -35 -43 -79 -54 -98 -11 -19 -43 -79 -73 -132 l-54 -98 -151 0 -151 0 -52 -95 c-29 -52 -52 -97 -52 -100 0 -3 130 -5 288 -5 263 0 290 2 304 18 13 14 162 276 246 432 13 25 48 88 78 141 56 100 65 140 40 175 -14 18 -32 19 -424 22 l-410 3 -63 -113 c-34 -62 -95 -171 -134 -243 -40 -71 -85 -154 -101 -182 l-29 -53 -267 0 c-169 0 -268 4 -268 10 0 9 75 145 172 312 l39 67 151 3 152 3 53 94 c29 51 53 95 53 97 0 2 -316 4 -701 4 l-701 0 -25 -27z m945 -195 c-8 -13 -55 -95 -103 -183 -48 -88 -92 -166 -97 -172 -13 -17 -228 -18 -228 -2 0 5 11 27 25 47 14 20 25 40 25 43 0 4 25 50 55 104 30 53 55 101 55 107 0 5 -10 8 -22 6 -16 -2 -43 -41 -108 -158 l-87 -155 -92 -3 c-50 -1 -91 0 -91 3 0 6 62 123 121 228 45 79 46 87 19 87 -22 0 -30 -11 -137 -202 l-65 -118 -130 0 -129 0 37 68 c20 37 46 81 56 99 24 40 83 148 105 191 l17 32 394 0 394 0 -14 -22z" />
      </g>
    </svg>
  );
}

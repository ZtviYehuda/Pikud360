import type { SVGProps } from "react";

export function ShabbatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Background glow around candles */}
      <path d="M 22 8 C 12 8, 12 20, 22 20 C 32 20, 32 8, 22 8 Z" fill="currentColor" fillOpacity="0.25" stroke="none" />
      <path d="M 42 8 C 32 8, 32 20, 42 20 C 52 20, 52 8, 42 8 Z" fill="currentColor" fillOpacity="0.25" stroke="none" />

      {/* Left Candlestick */}
      <path d="M 14 52 Q 22 46 22 34" />
      <path d="M 30 52 Q 22 46 22 34" />
      <path d="M 14 52 C 14 55, 30 55, 30 52 Z" fill="currentColor" fillOpacity="0.1"/>
      <path d="M 18 34 L 26 34 L 24 20 L 20 20 Z" />
      <path d="M 21 20 L 21 14 M 23 20 L 23 14" strokeWidth="1.5" />
      <path d="M 22 13 Q 19 10 22 4 Q 25 10 22 13" fill="currentColor" stroke="none" />

      {/* Right Candlestick */}
      <path d="M 34 52 Q 42 46 42 34" />
      <path d="M 50 52 Q 42 46 42 34" />
      <path d="M 34 52 C 34 55, 50 55, 50 52 Z" fill="currentColor" fillOpacity="0.1"/>
      <path d="M 38 34 L 46 34 L 44 20 L 40 20 Z" />
      <path d="M 41 20 L 41 14 M 43 20 L 43 14" strokeWidth="1.5" />
      <path d="M 42 13 Q 39 10 42 4 Q 45 10 42 13" fill="currentColor" stroke="none" />

      {/* Kiddush Cup (bottom left) */}
      <path d="M 4 40 L 14 40 L 11 48 L 7 48 Z" />
      <path d="M 9 48 L 9 56" />
      <path d="M 5 56 L 13 56" strokeWidth="3" />

      {/* Challah with Cover (bottom right) */}
      <path d="M 32 48 Q 42 44 56 46 L 62 52 L 28 54 Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M 32 48 Q 42 44 56 46 L 62 52 L 28 54 Z" />
      {/* Fringes */}
      <path d="M 28 54 L 28 58 M 34 53.5 L 34 57 M 40 52.5 L 40 56 M 46 51.5 L 46 55 M 52 51 L 52 54.5 M 58 51.5 L 58 54.5" strokeWidth="1.5" />
    </svg>
  );
}

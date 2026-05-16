type Props = { className?: string };

export function Logo({ className = 'w-10 h-10' }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="imoleLogoTitle"
      role="img"
    >
      <title id="imoleLogoTitle">Imole AI logo</title>
      <defs>
        <linearGradient id="imole-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* rounded square background */}
      <rect width="64" height="64" rx="12" fill="url(#imole-grad)" />

      {/* mark: stylized "i" + dot forming a radiology pulse */}
      <path d="M34 18c-6 2-10 6-12 12" stroke="rgba(255,255,255,0.98)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="26" r="4" fill="white" opacity="0.95" />
    </svg>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border-subtle bg-void">
      {/* NYC Skyline silhouette */}
      <div className="absolute inset-x-0 bottom-full h-16 overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 1200 60"
          preserveAspectRatio="xMidYMax slice"
          className="absolute bottom-0 w-full h-full"
          fill="var(--bg-void)"
        >
          {/* Simplified Art Deco NYC skyline */}
          <path d="M0,60 L0,45 L40,45 L40,35 L50,35 L50,25 L60,25 L60,35 L70,35 L70,45 L100,45 L100,30 L110,30 L110,20 L115,20 L115,15 L120,15 L120,10 L125,10 L125,5 L130,5 L130,10 L135,10 L135,15 L140,15 L140,20 L145,20 L145,30 L155,30 L155,45 L200,45 L200,35 L210,35 L210,25 L220,25 L220,35 L230,35 L230,45 L280,45 L280,20 L290,20 L290,45 L350,45 L350,40 L360,40 L360,30 L370,30 L370,40 L380,40 L380,45 L450,45 L450,35 L460,35 L460,20 L470,20 L470,15 L480,15 L480,8 L490,8 L490,15 L500,15 L500,20 L510,20 L510,35 L520,35 L520,45 L600,45 L600,25 L610,25 L610,45 L700,45 L700,30 L710,30 L710,20 L720,20 L720,30 L730,30 L730,45 L800,45 L800,35 L810,35 L810,45 L900,45 L900,40 L910,40 L910,25 L920,25 L920,40 L930,40 L930,45 L1000,45 L1000,30 L1010,30 L1010,45 L1100,45 L1100,35 L1110,35 L1110,25 L1120,25 L1120,35 L1130,35 L1130,45 L1200,45 L1200,60 Z" />
          {/* Window lights */}
          <rect x="122" y="12" width="2" height="3" fill="var(--amber)" opacity="0.6" />
          <rect x="126" y="18" width="2" height="3" fill="var(--amber)" opacity="0.4" />
          <rect x="132" y="12" width="2" height="3" fill="var(--amber)" opacity="0.5" />
          <rect x="475" y="12" width="2" height="3" fill="var(--amber)" opacity="0.6" />
          <rect x="483" y="15" width="2" height="3" fill="var(--amber)" opacity="0.4" />
          <rect x="488" y="10" width="2" height="3" fill="var(--amber)" opacity="0.5" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            dltracker is not affiliated with Valve Corporation.
          </p>
          <div className="flex gap-6">
            <Link
              href="/about"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Privacy
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

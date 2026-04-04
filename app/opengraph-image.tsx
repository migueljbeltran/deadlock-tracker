import { ImageResponse } from "next/og";

export const revalidate = 604800;
export const alt = "dltracker — Deadlock Stats Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080B10",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background radial glow — soul green */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "30%",
            width: "40%",
            height: "80%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(61, 220, 132, 0.08) 0%, transparent 70%)",
          }}
        />
        {/* Background radial glow — amber */}
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            right: "20%",
            width: "50%",
            height: "80%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(212, 168, 83, 0.06) 0%, transparent 70%)",
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 80,
            right: 80,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.4), transparent)",
          }}
        />

        {/* Bottom decorative line */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 80,
            right: 80,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(212, 168, 83, 0.4), transparent)",
          }}
        />

        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 72,
            width: 20,
            height: 20,
            borderTop: "2px solid rgba(212, 168, 83, 0.5)",
            borderLeft: "2px solid rgba(212, 168, 83, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 72,
            width: 20,
            height: 20,
            borderTop: "2px solid rgba(212, 168, 83, 0.5)",
            borderRight: "2px solid rgba(212, 168, 83, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 72,
            width: 20,
            height: 20,
            borderBottom: "2px solid rgba(212, 168, 83, 0.5)",
            borderLeft: "2px solid rgba(212, 168, 83, 0.5)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 72,
            width: 20,
            height: 20,
            borderBottom: "2px solid rgba(212, 168, 83, 0.5)",
            borderRight: "2px solid rgba(212, 168, 83, 0.5)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Site name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#D4A853",
              fontFamily: "serif",
            }}
          >
            dltracker
          </div>

          {/* Divider line */}
          <div
            style={{
              width: 140,
              height: 2,
              marginTop: 8,
              marginBottom: 8,
              background: "linear-gradient(90deg, transparent, #3DDC84, transparent)",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.85)",
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
            }}
          >
            Deadlock Stats Tracker
          </div>

          {/* Features row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginTop: 24,
              fontSize: 18,
              color: "rgba(61, 220, 132, 0.8)",
              letterSpacing: "0.04em",
            }}
          >
            <span>Hero Win Rates</span>
            <span style={{ color: "rgba(212, 168, 83, 0.4)" }}>|</span>
            <span>Match History</span>
            <span style={{ color: "rgba(212, 168, 83, 0.4)" }}>|</span>
            <span>Player Stats</span>
            <span style={{ color: "rgba(212, 168, 83, 0.4)" }}>|</span>
            <span>Leaderboards</span>
          </div>
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.35)",
            letterSpacing: "0.1em",
          }}
        >
          dltracker.app
        </div>
      </div>
    ),
    { ...size },
  );
}

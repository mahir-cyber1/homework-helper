import { ImageResponse } from "next/og";

export const alt = "Gebärdensprache KI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "76px",
          background: "#0d1016",
          color: "#f8fafc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#78d4bd",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            Webcam · Training · Live Text
          </div>
          <div
            style={{
              maxWidth: 720,
              fontSize: 88,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            Gebärdensprache KI
          </div>
          <div
            style={{
              maxWidth: 680,
              color: "#b9c1cf",
              fontSize: 36,
              lineHeight: 1.25,
            }}
          >
            Gebärden aufnehmen, korrigieren und live als Text anzeigen.
          </div>
        </div>
        <div
          style={{
            width: 270,
            height: 270,
            borderRadius: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#173226",
            border: "8px solid #78d4bd",
            color: "#94f0cf",
            fontSize: 92,
            fontWeight: 900,
          }}
        >
          DGS
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";
import {
  BRAND_FOREGROUND_ON_PRIMARY,
  BRAND_PRIMARY,
  BRAND_PRIMARY_LIGHT,
} from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_PRIMARY_LIGHT} 100%)`,
          borderRadius: "40px",
        }}
      >
        <svg width="108" height="108" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="2.75" fill={BRAND_FOREGROUND_ON_PRIMARY} />
          <circle
            cx="12"
            cy="12"
            r="6.25"
            stroke={BRAND_FOREGROUND_ON_PRIMARY}
            strokeWidth="1.75"
            opacity="0.72"
          />
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke={BRAND_FOREGROUND_ON_PRIMARY}
            strokeWidth="1.25"
            opacity="0.36"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}

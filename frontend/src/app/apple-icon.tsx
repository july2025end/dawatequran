import { ImageResponse } from "next/og";
import { BrandMark } from "./brand-mark";

// iPhone/iPad home-screen icon. iOS rounds the corners itself, so the square is left square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={180} rounded={false} />, size);
}

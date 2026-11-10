import { ImageResponse } from "next/og";
import { BrandMark } from "./brand-mark";

// Browser tab icon plus the sizes Android and the install prompt use.
export function generateImageMetadata() {
  return [32, 192, 512].map((size) => ({ id: String(size), size: { width: size, height: size }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> | string }) {
  const size = Number(await id);
  return new ImageResponse(<BrandMark size={size} rounded={size <= 32} />, { width: size, height: size });
}

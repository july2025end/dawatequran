// The app icon drawn for next/og: the blue tile with the open book from the header.
export function BrandMark({ size, rounded }: { size: number; rounded: boolean }) {
  const glyph = Math.round(size * 0.56);
  return (
    <div
      style={{
        width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(180deg, #2b8cff 0%, #0062d1 100%)",
        borderRadius: rounded ? size * 0.225 : 0,
      }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </svg>
    </div>
  );
}

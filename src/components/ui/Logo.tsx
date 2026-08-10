import Image from "next/image";
import { BRAND } from "@/lib/brand";

export function Logo({
  size = "md",
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const dims = { sm: 26, md: 30, lg: 46 }[size];

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.svg"
        alt={BRAND.name}
        width={dims}
        height={dims}
        priority
        className="shrink-0"
      />
      {showWordmark && (
        <span
          className="font-semibold tracking-tight"
          style={{ color: "var(--foreground)", fontSize: size === "lg" ? 18 : 15 }}
        >
          {BRAND.name}
        </span>
      )}
    </div>
  );
}

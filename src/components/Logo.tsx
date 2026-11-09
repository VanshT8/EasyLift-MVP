import Image from "next/image";

// Assets in /public, cut from the brand logo: the icon alone and the full lockup with name + tagline.
const MARK = { src: "/logo-mark.png", width: 400, height: 192 };
const FULL = { src: "/logo-full.png", width: 800, height: 730 };

/** Dumbbell + clock icon. Decorative unless `title` is given. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return <Image {...MARK} alt={title ?? ""} className={className} priority />;
}

/** Full logo with "EasyLift" and the tagline, for the welcome screen. */
export function LogoFull({ className }: { className?: string }) {
  return <Image {...FULL} alt="EasyLift — Less waiting. More lifting." className={className} priority />;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-auto" />
      <span className="text-lg font-bold tracking-tight">EasyLift</span>
    </span>
  );
}

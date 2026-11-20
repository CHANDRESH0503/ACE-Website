import Image from "next/image";
import type { TeamMember } from "@/lib/ace-content";

/**
 * A team portrait (pre-cropped to one shared framing) toned as an ACE-blue duotone. When `developed` is set, the full-colour photo wipes in from the bottom,
 * like a print coming up in the tray.
 */
export function Portrait({
  member,
  developed,
  sizes,
  priority,
  className,
}: {
  member: TeamMember;
  developed?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const f = member.focus ?? { x: 50, y: 50, zoom: 1 };
  const style = {
    objectPosition: `${f.x}% ${f.y}%`,
    transformOrigin: `${f.x}% ${f.y}%`,
    transform: `scale(${f.zoom})`,
  };
  const alt = `${member.firstName} ${member.lastName}, ${member.positions.join(", ")}`;

  if (!member.imageUrl) {
    return (
      <div className={`grid place-items-center bg-muted text-6xl font-bold text-primary ${className ?? ""}`}>
        {member.firstName[0]}
        {member.lastName[0]}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[hsl(var(--signal))] ${className ?? ""}`}>
      {/* Duotone layer */}
      <Image
        src={member.imageUrl}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        style={style}
        className="object-cover opacity-90 mix-blend-multiply grayscale contrast-[1.15]"
      />
      {/* Colour layer, developed on demand */}
      <div
        className={`absolute inset-0 transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          developed ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(100%_0_0_0)]"
        }`}
      >
        <Image src={member.imageUrl} alt={alt} fill sizes={sizes} draggable={false} style={style} className="portrait-grade object-cover" />
        {/* Shared grade: a slight ACE-blue cast in the shadows ties seven cameras into one set */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[hsl(var(--signal))] opacity-[0.14] mix-blend-color" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(2,16,55,0.55),transparent_45%)]" />
      </div>
      {/* Fine grain unifies the different cameras */}
      <div aria-hidden="true" className="portrait-grain pointer-events-none absolute inset-0" />
    </div>
  );
}

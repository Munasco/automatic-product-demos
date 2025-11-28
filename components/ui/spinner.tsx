import { cn } from "../../lib/utils";

export function Spinner({ className, light = false }: { className?: string; light?: boolean }) {
  const bladeClass = cn(
    "absolute top-[37%] left-[44%] w-0.5 h-2.5 rounded-[0.5px] animate-[spinner-blade_1s_linear_infinite]",
    light ? "bg-gradient-to-b from-foreground to-foreground-muted" : "bg-gradient-to-b from-foreground to-foreground-secondary"
  );

  return (
    <div className={cn("relative w-4 h-4 inline-block", className)}>
      <div className={bladeClass} style={{ transform: "rotate(0deg) translateY(-130%)", animationDelay: "-1.667s" }} />
      <div className={bladeClass} style={{ transform: "rotate(30deg) translateY(-130%)", animationDelay: "-1.583s" }} />
      <div className={bladeClass} style={{ transform: "rotate(60deg) translateY(-130%)", animationDelay: "-1.5s" }} />
      <div className={bladeClass} style={{ transform: "rotate(90deg) translateY(-130%)", animationDelay: "-1.417s" }} />
      <div className={bladeClass} style={{ transform: "rotate(120deg) translateY(-130%)", animationDelay: "-1.333s" }} />
      <div className={bladeClass} style={{ transform: "rotate(150deg) translateY(-130%)", animationDelay: "-1.25s" }} />
      <div className={bladeClass} style={{ transform: "rotate(180deg) translateY(-130%)", animationDelay: "-1.167s" }} />
      <div className={bladeClass} style={{ transform: "rotate(210deg) translateY(-130%)", animationDelay: "-1.083s" }} />
      <div className={bladeClass} style={{ transform: "rotate(240deg) translateY(-130%)", animationDelay: "-1s" }} />
      <div className={bladeClass} style={{ transform: "rotate(270deg) translateY(-130%)", animationDelay: "-0.917s" }} />
      <div className={bladeClass} style={{ transform: "rotate(300deg) translateY(-130%)", animationDelay: "-0.833s" }} />
      <div className={bladeClass} style={{ transform: "rotate(330deg) translateY(-130%)", animationDelay: "-0.75s" }} />
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-background-tertiary", className)} {...props} />;
}

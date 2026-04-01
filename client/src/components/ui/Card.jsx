import { cn } from "../../utils/cn";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

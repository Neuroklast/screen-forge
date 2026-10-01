import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

// Shared control-UI primitives for the film studio and exercise control. They wrap the
// existing design tokens and class names, so adopting them does not change the
// look — it removes the duplicated markup between the two products. Fictional
// rendered scenes are NOT part of this system.

export function Panel({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={`panel ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

export function Button({
  variant = "default",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
}) {
  const variantClass =
    variant === "primary" ? "primary" : variant === "danger" ? "danger" : "";
  return (
    <button
      className={[variantClass, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function FormField({
  label,
  className = "",
  children,
}: {
  label: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      {label}
      {children}
    </label>
  );
}

export function Tabs({
  items,
  active,
  onSelect,
  label,
}: {
  items: readonly (readonly [string, string])[];
  active: string;
  onSelect: (id: string) => void;
  label?: string;
}) {
  return (
    <nav className="training-nav" aria-label={label}>
      {items.map(([id, text]) => (
        <button
          key={id}
          className={active === id ? "active" : ""}
          onClick={() => onSelect(id)}
        >
          {text}
        </button>
      ))}
    </nav>
  );
}

export function Status({
  tone,
  children,
}: {
  tone: "up" | "down" | "idle";
  children: ReactNode;
}) {
  return (
    <span className={tone === "up" ? "status-up" : tone === "down" ? "status-down" : ""}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="field-empty">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

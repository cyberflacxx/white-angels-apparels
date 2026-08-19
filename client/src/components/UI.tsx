import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faBoxOpen, faCircleNotch } from "@fortawesome/free-solid-svg-icons";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`section ${className}`}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {action && <div className="section-heading__action">{action}</div>}
    </div>
  );
}

export function AppButton({ variant = "primary", icon = faArrowRight, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "soft" | "success" | "danger"; icon?: IconDefinition | null }) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...props}>
      <span>{children}</span>
      {icon && <FontAwesomeIcon icon={icon} />}
    </button>
  );
}

export function AppLink({ variant = "primary", icon = faArrowRight, children, className = "", ...props }: LinkProps & { variant?: "primary" | "secondary" | "ghost" | "soft"; icon?: IconDefinition | null }) {
  return (
    <Link className={`btn btn--${variant} ${className}`} {...props}>
      <span>{children}</span>
      {icon && <FontAwesomeIcon icon={icon} />}
    </Link>
  );
}

export function Field({ label, error, helper, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; helper?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {helper ? <span className="field__helper">{helper}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, error, helper, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; helper?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <textarea aria-invalid={Boolean(error)} {...props} />
      {helper ? <span className="field__helper">{helper}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function SelectField({ label, error, helper, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode; error?: string; helper?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <select aria-invalid={Boolean(error)} {...props}>{children}</select>
      {helper ? <span className="field__helper">{helper}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  );
}

export function EmptyState({ title, copy, action, icon = faBoxOpen }: { title: string; copy?: string; action?: ReactNode; icon?: IconDefinition }) {
  return (
    <div className="empty-state">
      <FontAwesomeIcon icon={icon} />
      <h3>{title}</h3>
      {copy && <p>{copy}</p>}
      {action}
    </div>
  );
}

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div />
          <span />
          <strong />
          <small />
        </div>
      ))}
    </div>
  );
}

export function LoadingButtonLabel({ label }: { label: string }) {
  return (
    <>
      <FontAwesomeIcon icon={faCircleNotch} spin />
      <span>{label}</span>
    </>
  );
}

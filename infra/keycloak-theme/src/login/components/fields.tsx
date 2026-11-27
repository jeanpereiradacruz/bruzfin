import { type InputHTMLAttributes, useId, useState } from 'react';

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  readonly label: string;
  readonly name: string;
  /** Mensagem de erro já traduzida (vinda de `messagesPerField`). */
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
};

const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(' ') || undefined;

/** Campo de texto com rótulo visível, dica e erro ligados por aria-describedby. */
export function TextField({ label, name, error, hint, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className="bf-field">
      <label className="bf-label" htmlFor={id}>
        {label}
      </label>
      <input
        {...input}
        id={id}
        name={name}
        className="bf-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
      />
      {hint ? (
        <span id={`${id}-hint`} className="bf-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="bf-error" aria-live="polite">
          {error}
        </span>
      ) : null}
    </div>
  );
}

type PasswordFieldProps = FieldProps & {
  readonly showLabel: string;
  readonly hideLabel: string;
};

/** Senha com botão de mostrar/ocultar (o botão anuncia o estado com aria-pressed). */
export function PasswordField({
  label,
  name,
  error,
  hint,
  showLabel,
  hideLabel,
  ...input
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="bf-field">
      <label className="bf-label" htmlFor={id}>
        {label}
      </label>
      <span className="bf-password">
        <input
          {...input}
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        />
        <button
          type="button"
          className="bf-icon-button"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path d="M4 4l16 16" /> : null}
          </svg>
        </button>
      </span>
      {hint ? (
        <span id={`${id}-hint`} className="bf-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="bf-error" aria-live="polite">
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Botão de envio; `disabled` depois do primeiro envio evita enviar o formulário duas vezes. */
export function SubmitButton({
  label,
  name,
  value,
  primary = true,
  disabled = false,
}: {
  readonly label: string;
  readonly name?: string;
  readonly value?: string;
  readonly primary?: boolean;
  readonly disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled}
      className={primary ? 'bf-button bf-button--primary' : 'bf-button'}
    >
      {label}
    </button>
  );
}

export function EnvelopeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

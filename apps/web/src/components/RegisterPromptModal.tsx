import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  title: string;
  message: string;
  registerFrom: string;
  onClose: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function RegisterPromptModal({
  open,
  title,
  message,
  registerFrom,
  onClose,
  secondaryLabel,
  onSecondary,
}: Props) {
  if (!open) return null;

  const registerHref = `/auth?mode=register&from=${encodeURIComponent(registerFrom)}`;

  return (
    <div
      className="register-prompt-backdrop"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="register-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="register-prompt-title" className="register-prompt-modal__title">
          {title}
        </h2>
        <p className="register-prompt-modal__message">{message}</p>
        <div className="register-prompt-modal__actions">
          <Link className="dash-main-btn register-prompt-modal__primary" to={registerHref} onClick={onClose}>
            Create free account
          </Link>
        </div>
        <div className="register-prompt-modal__footer">
          {secondaryLabel && onSecondary ? (
            <button type="button" className="register-prompt-modal__secondary" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          ) : null}
          <button type="button" className="register-prompt-modal__dismiss" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

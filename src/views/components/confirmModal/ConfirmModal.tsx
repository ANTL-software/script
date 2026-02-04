import './confirmModal.scss';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaTrash } from 'react-icons/fa';
import Button from '../button/Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const icons = {
  warning: FaExclamationTriangle,
  danger: FaTrash,
  info: FaInfoCircle,
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const Icon = icons[type];
  const buttonVariant = type === 'danger' ? 'danger' : 'primary';

  return (
    <div className="confirm-modal__overlay" onClick={onCancel}>
      <div className={`confirm-modal confirm-modal--${type}`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="confirm-modal__close"
          onClick={onCancel}
          disabled={isLoading}
        >
          <FaTimes />
        </button>

        <div className="confirm-modal__icon">
          <Icon />
        </div>

        <h2 className="confirm-modal__title">{title}</h2>
        <p className="confirm-modal__message">{message}</p>

        <div className="confirm-modal__actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

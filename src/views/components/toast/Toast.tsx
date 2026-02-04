import './toast.scss';
import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

export default function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        <Icon />
      </div>
      <div className="toast__content">
        <p className="toast__message">{message}</p>
      </div>
      <button className="toast__close" onClick={() => onClose(id)}>
        <FaTimes />
      </button>
    </div>
  );
}

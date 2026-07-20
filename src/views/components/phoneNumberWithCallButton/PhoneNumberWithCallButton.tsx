import './phoneNumberWithCallButton.scss';
import { FaPhoneAlt, FaMobileAlt } from 'react-icons/fa';
import { Button } from '../button/index.ts';

interface PhoneNumberWithCallButtonProps {
  phoneNumber: string;
  type: 'principal' | 'contact';
  onCall: (phoneNumber: string) => void;
  showCallButton: boolean;
  disabled?: boolean;
  isCalling?: boolean;
}

export default function PhoneNumberWithCallButton({
  phoneNumber,
  type,
  onCall,
  showCallButton,
  disabled = false,
  isCalling = false,
}: PhoneNumberWithCallButtonProps) {
  // Déterminer l'icône selon le type
  const icon = type === 'principal' ? <FaPhoneAlt /> : <FaMobileAlt />;

  // Déterminer si le bouton doit être désactivé
  const isDisabled = disabled || !phoneNumber || isCalling;

  const handleCallClick = () => {
    if (!isDisabled && phoneNumber) {
      onCall(phoneNumber);
    }
  };

  return (
    <div className="phone-number-with-call-button">
      <span className="phone-number-with-call-button__number">
        {phoneNumber || '-'}
      </span>
      {showCallButton && (
        <Button
          variant="primary"
          size="small"
          onClick={handleCallClick}
          disabled={isDisabled}
          className="phone-number-with-call-button__btn"
          title={type === 'principal' ? 'Appeler ce numéro' : 'Appeler le numéro de contact'}
          isLoading={isCalling}
        >
          {icon}
        </Button>
      )}
    </div>
  );
}

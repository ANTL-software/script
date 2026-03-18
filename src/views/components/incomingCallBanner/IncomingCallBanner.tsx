import './incomingCallBanner.scss';
import { IoCall, IoCallSharp } from 'react-icons/io5';
import { useDialer } from '../../../hooks';

export default function IncomingCallBanner() {
  const { incomingCall, answer, reject } = useDialer();

  if (!incomingCall) return null;

  return (
    <div className="incoming-call-banner">
      <div className="incoming-call-banner__info">
        <span className="incoming-call-banner__dot" />
        <div>
          <p className="incoming-call-banner__label">Appel entrant</p>
          <p className="incoming-call-banner__from">
            {incomingCall.displayName !== incomingCall.from
              ? `${incomingCall.displayName} — ${incomingCall.from}`
              : incomingCall.from}
          </p>
        </div>
      </div>
      <div className="incoming-call-banner__actions">
        <button
          className="incoming-call-banner__btn incoming-call-banner__btn--answer"
          onClick={answer}
          title="Décrocher"
        >
          <IoCall size={18} />
          Décrocher
        </button>
        <button
          className="incoming-call-banner__btn incoming-call-banner__btn--reject"
          onClick={reject}
          title="Rejeter"
        >
          <IoCallSharp size={18} style={{ transform: 'rotate(135deg)' }} />
          Rejeter
        </button>
      </div>
    </div>
  );
}

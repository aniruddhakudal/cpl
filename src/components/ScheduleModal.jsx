import { useEffect } from 'react';
import scheduleImage from '../assets/images/schedule_2026.jpeg';
import './ScheduleModal.css';

const ScheduleModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="schedule-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Festival Schedule 2026"
      onClick={onClose}
    >
      <div className="schedule-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="schedule-modal__close"
          onClick={onClose}
          aria-label="Close schedule"
        >
          ×
        </button>
        <img
          src={scheduleImage}
          alt="Celebria Ganpati Festival 2026 schedule"
          className="schedule-modal__image"
        />
      </div>
    </div>
  );
};

export default ScheduleModal;

import { useEffect } from 'react';
import organizersImage from '../assets/images/organizers_2026.jpeg';
import './ScheduleModal.css';

const OrganizersModal = ({ isOpen, onClose }) => {
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
      className="schedule-modal ganpati-theme"
      role="dialog"
      aria-modal="true"
      aria-label="Festival Organizers 2026"
      onClick={onClose}
    >
      <div className="schedule-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="schedule-modal__close"
          onClick={onClose}
          aria-label="Close organizers"
        >
          ×
        </button>
        <img
          src={organizersImage}
          alt="Celebria Ganpati Festival 2026 organizers"
          className="schedule-modal__image"
        />
      </div>
    </div>
  );
};

export default OrganizersModal;

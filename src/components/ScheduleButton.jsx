import { useState } from 'react';
import ScheduleModal from './ScheduleModal';

const ScheduleButton = ({ className, children = 'Schedule' }) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setScheduleOpen(true)}
      >
        {children}
      </button>
      <ScheduleModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </>
  );
};

export default ScheduleButton;

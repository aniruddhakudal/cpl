import { useState } from 'react';
import OrganizersModal from './OrganizersModal';

const OrganizersButton = ({ className, children = 'Organizers' }) => {
  const [organizersOpen, setOrganizersOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOrganizersOpen(true)}
      >
        {children}
      </button>
      <OrganizersModal isOpen={organizersOpen} onClose={() => setOrganizersOpen(false)} />
    </>
  );
};

export default OrganizersButton;

import { useEffect, useState } from 'react';
import { downloadReceipt, resolveReceiptFileUrl } from '../utils/expensesApi';
import './ReceiptPreviewModal.css';

function isPdfReceipt(receipt) {
  if (!receipt) return false;
  if (receipt.mime_type === 'application/pdf') return true;
  return (receipt.file_name || '').toLowerCase().endsWith('.pdf');
}

const ReceiptPreviewModal = ({ receipt, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    setDownloadError('');
  }, [receipt]);

  const handleDownload = async () => {
    setDownloadError('');
    setDownloading(true);
    try {
      await downloadReceipt(receipt);
    } catch (error) {
      setDownloadError(error.message || 'Failed to download receipt.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!receipt) return undefined;

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
  }, [receipt, onClose]);

  if (!receipt) {
    return null;
  }

  const isPdf = isPdfReceipt(receipt);
  const previewUrl = resolveReceiptFileUrl(receipt.file_url);

  return (
    <div
      className="receipt-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Receipt preview: ${receipt.file_name}`}
      onClick={onClose}
    >
      <div className="receipt-modal__panel" onClick={(event) => event.stopPropagation()}>
        <div className="receipt-modal__header">
          <h2 className="receipt-modal__title">{receipt.file_name}</h2>
          <div className="receipt-modal__actions">
            <button
              type="button"
              className="receipt-modal__download"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download'}
            </button>
            <button
              type="button"
              className="receipt-modal__close"
              onClick={onClose}
              aria-label="Close receipt preview"
            >
              ×
            </button>
          </div>
        </div>
        {downloadError && (
          <p className="receipt-modal__error" role="alert">{downloadError}</p>
        )}
        <div className="receipt-modal__content">
          {isPdf ? (
            <iframe
              src={previewUrl}
              title={receipt.file_name}
              className="receipt-modal__pdf"
            />
          ) : (
            <img
              src={previewUrl}
              alt={receipt.file_name}
              className="receipt-modal__image"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;

export const TRANSACTION_COMPLETED_EVENT = 'transactionCompleted';

export const dispatchTransactionCompleted = (detail) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  window.dispatchEvent(new CustomEvent(TRANSACTION_COMPLETED_EVENT, { detail }));
};



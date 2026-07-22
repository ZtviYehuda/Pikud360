export const TRANSFERS_BASE_ENDPOINT = '/transfers'; // Use for create
export const TRANSFERS_PENDING_ENDPOINT = '/transfers/pending';
export const TRANSFERS_HISTORY_ENDPOINT = '/transfers/history';

// Helpers for dynamic IDs
export const approveTransferEndpoint = (id: number) => `/transfers/${id}/approve`;
export const rejectTransferEndpoint = (id: number) => `/transfers/${id}/reject`;
export const cancelTransferEndpoint = (id: number) => `/transfers/${id}/cancel`;
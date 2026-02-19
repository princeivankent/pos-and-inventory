export const environment = {
  production: false,
  apiUrl: '/api',
  // Set to true to skip payment collection and upgrade plans directly (dev/testing).
  // Mirror of BYPASS_PAYMENT in backend/.env — both must match.
  bypassPayment: true,
};

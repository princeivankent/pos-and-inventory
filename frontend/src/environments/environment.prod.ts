export const environment = {
  production: true,
  apiUrl: '/api',
  // Set to false in production to require PayMongo payment before upgrading.
  // Mirror of BYPASS_PAYMENT in backend/.env — both must match.
  bypassPayment: false,
};

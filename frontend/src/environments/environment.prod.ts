export const environment = {
  production: true,
  apiUrl: '/api',
  // Set to false in production to require PayMongo payment before upgrading.
  // Mirror of BYPASS_PAYMENT in backend/.env — both must match.
  bypassPayment: false,
  emailjs: {
    serviceId: 'service_u7kzvmf',
    forgotPasswordTemplateId: 'template_k1oj5b1',
    publicKey: 'y6Zyu9ibUG9yYzTXw',
  },
};

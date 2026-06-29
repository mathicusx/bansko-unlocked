export const environment = {
  production: true,
  // TODO(deploy): point at the Bansko Unlocked backend (Resend-backed contact
  // endpoint) once it is provisioned. Until then the contact form POST will 404
  // — expected for the static-only first deploy.
  apiUrl: 'https://api.banskounlocked.com/api',
  contact: {
    phones: {
      uk: {
        countryCode: '+44',
        part1: '747',
        part2: '236',
        part3: '2817',
        label: 'UK Number',
      },
      bulgaria: {
        countryCode: '+359',
        part1: '894',
        part2: '494',
        part3: '126',
        label: 'Bulgarian Number',
      },
    },
    email: 'info@banskounlocked.com',
  },
};

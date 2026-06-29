export const environment = {
  production: false,
  // apiUrl: 'https://enduro-brothers-bulgaria.onrender.com/api',
  apiUrl: 'http://localhost:3000/api',
  contact: {
    phones: {
      uk: {
        countryCode: '+44',
        part1: '747',
        part2: '236',
        part3: '2817',
        label: 'UK Number'
      },
      bulgaria: {
        countryCode: '+359',
        part1: '894',
        part2: '494',
        part3: '126',
        label: 'Bulgarian Number'
      }
    },
    email: 'info@banskounlocked.com'
  }
  // Admin credentials are now stored as hashes in auth.service.ts
  // To generate new hashes, run: node generate-auth-hash.js <username> <password>
};
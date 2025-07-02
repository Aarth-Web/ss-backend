import { registerAs } from '@nestjs/config';

export default registerAs('rapidapi', () => ({
  key: process.env.RAPIDAPI_KEY,
  host: process.env.RAPIDAPI_HOST || 'deep-translate1.p.rapidapi.com',
  url:
    process.env.RAPIDAPI_URL ||
    'https://deep-translate1.p.rapidapi.com/language/translate/v2',
}));

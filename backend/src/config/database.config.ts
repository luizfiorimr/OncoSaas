import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://ONCONAV:ONCONAV_dev@localhost:5432/ONCONAV_development',
  schema: process.env.DATABASE_SCHEMA || 'public',
}));

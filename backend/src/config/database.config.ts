import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://medsaas:medsaas_dev@localhost:5432/medsaas_development',
  schema: process.env.DATABASE_SCHEMA || 'public',
}));



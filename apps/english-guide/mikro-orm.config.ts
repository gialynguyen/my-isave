import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: ['./build/features/**/*.js'],
  entitiesTs: ['./src/features/**/*.ts'],
  dbName: 'english_guide',
  debug: true,
  migrations: {
    path: './build/migrations',
    pathTs: './src/migrations'
  }
});
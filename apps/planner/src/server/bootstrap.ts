import { createPostgresORM } from './providers/postgres';

export default async function bootstrap() {
  const orm = await createPostgresORM();
  if (process.env.NODE_ENV === 'development') {
    orm.schema.updateSchema();
  }
}

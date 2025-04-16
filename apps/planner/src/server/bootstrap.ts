import { createPostgresORM } from './providers/postgres';

export default async function bootstrap() {
  const orm = await createPostgresORM();
  const migrator = orm.getMigrator();
  await migrator.up();

  if (process.env.NODE_ENV === 'development') {
    orm.schema.updateSchema();
  }
}

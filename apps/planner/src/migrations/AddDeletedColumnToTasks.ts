import { Migration } from '@mikro-orm/migrations';

export class AddDeletedColumnToTask extends Migration {
  up(): Promise<void> | void {
    this.addSql('ALTER TABLE "task" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;');
    this.addSql('ALTER TABLE "task" ADD COLUMN "deleted_at" TIMESTAMP NULL;');
  }

  down(): Promise<void> | void {
    this.addSql('ALTER TABLE "task" DROP COLUMN "is_deleted";');
    this.addSql('ALTER TABLE "task" DROP COLUMN "deleted_at";');
  }
}

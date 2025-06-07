import { Migration } from '@mikro-orm/migrations';

export class AddIsArchivedToTasks extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE "tasks" ADD COLUMN "is_archived" BOOLEAN NOT NULL DEFAULT false;');
    this.addSql('ALTER TABLE "tasks" ADD COLUMN "archived_at" TIMESTAMP NULL;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "tasks" DROP COLUMN "is_archived";');
    this.addSql('ALTER TABLE "tasks" DROP COLUMN "archived_at";');
  }
}

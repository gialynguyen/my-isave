import { Migration } from '@mikro-orm/migrations';
import { TaskEntity } from 'features/task/entity';
import { generateShortId } from 'features/task/utils/short-id';

export class AddShortIdToTasks extends Migration {
  async up(): Promise<void> {
    // Get all tasks that don't have a shortId yet
    const tasks = await this.getEntityManager().find(TaskEntity, {
      shortId: { $exists: false }
    });

    console.log(`Found ${tasks.length} tasks that need a shortId`);

    // Generate and assign a unique shortId to each task
    for (const task of tasks) {
      let shortId = generateShortId();
      let existingTask = await this.getEntityManager().findOne(TaskEntity, { shortId });

      // Make sure the generated shortId is unique
      while (existingTask) {
        shortId = generateShortId();
        existingTask = await this.getEntityManager().findOne(TaskEntity, { shortId });
      }

      // Update the task with the new shortId
      task.shortId = shortId;
      this.getEntityManager().persist(task);
    }

    // Flush the changes
    await this.getEntityManager().flush();
  }

  async down(): Promise<void> {
    // Remove the shortId column
    this.addSql(`
      ALTER TABLE task
      DROP COLUMN IF EXISTS "short_id";
    `);
  }
}

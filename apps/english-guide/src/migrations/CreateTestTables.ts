import { Migration } from '@mikro-orm/migrations';

export class CreateTestTables extends Migration {

  async up(): Promise<void> {
    // Create test table
    this.addSql(`
      CREATE TABLE "test" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "difficulty" text CHECK ("difficulty" IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'beginner',
        "questions" jsonb NOT NULL DEFAULT '[]',
        "tags" jsonb NOT NULL DEFAULT '[]',
        "time_limit" int NOT NULL DEFAULT 0,
        "passing_score" int NOT NULL DEFAULT 70,
        "metadata" jsonb NOT NULL DEFAULT '{"totalQuestions": 0, "estimatedDuration": 0, "topics": [], "skillsAssessed": []}',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "test_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create test_result table
    this.addSql(`
      CREATE TABLE "test_result" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "test_id" uuid NOT NULL,
        "score" int NOT NULL DEFAULT 0,
        "total_questions" int NOT NULL DEFAULT 0,
        "correct_answers" int NOT NULL DEFAULT 0,
        "time_spent" int NOT NULL DEFAULT 0,
        "started_at" timestamptz NOT NULL DEFAULT now(),
        "completed_at" timestamptz,
        "is_passed" boolean NOT NULL DEFAULT false,
        "answers" jsonb NOT NULL DEFAULT '[]',
        "feedback" jsonb NOT NULL DEFAULT '{"overallFeedback": "", "strengths": [], "areasForImprovement": [], "recommendedStudyTopics": []}',
        "detailed_analysis" jsonb NOT NULL DEFAULT '{"questionTypePerformance": {}, "difficultyPerformance": {}, "topicPerformance": {}, "timePerQuestion": []}',
        CONSTRAINT "test_result_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign key constraints
    this.addSql(`
      ALTER TABLE "test_result" 
      ADD CONSTRAINT "test_result_user_id_foreign" 
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    this.addSql(`
      ALTER TABLE "test_result" 
      ADD CONSTRAINT "test_result_test_id_foreign" 
      FOREIGN KEY ("test_id") REFERENCES "test" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    // Add indexes for better performance
    this.addSql(`CREATE INDEX "test_difficulty_idx" ON "test" ("difficulty");`);
    this.addSql(`CREATE INDEX "test_is_active_idx" ON "test" ("is_active");`);
    this.addSql(`CREATE INDEX "test_result_user_id_idx" ON "test_result" ("user_id");`);
    this.addSql(`CREATE INDEX "test_result_test_id_idx" ON "test_result" ("test_id");`);
    this.addSql(`CREATE INDEX "test_result_score_idx" ON "test_result" ("score");`);
    this.addSql(`CREATE INDEX "test_result_completed_at_idx" ON "test_result" ("completed_at");`);
  }

  async down(): Promise<void> {
    // Drop foreign key constraints first
    this.addSql(`ALTER TABLE "test_result" DROP CONSTRAINT "test_result_user_id_foreign";`);
    this.addSql(`ALTER TABLE "test_result" DROP CONSTRAINT "test_result_test_id_foreign";`);
    
    // Drop tables
    this.addSql(`DROP TABLE IF EXISTS "test_result";`);
    this.addSql(`DROP TABLE IF EXISTS "test";`);
  }
}
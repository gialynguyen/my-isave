import { Migration } from '@mikro-orm/migrations';

export class InitialMigration extends Migration {

  async up(): Promise<void> {
    // Create user table
    this.addSql(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "email" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "proficiency_level" text CHECK ("proficiency_level" IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'beginner',
        "learning_preferences" jsonb NOT NULL DEFAULT '{}',
        "progress_stats" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create unique constraint on email
    this.addSql(`ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE ("email");`);

    // Create vocabulary table
    this.addSql(`
      CREATE TABLE "vocabulary" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "word" varchar(255) NOT NULL,
        "definition" text NOT NULL,
        "pronunciation" varchar(255) NOT NULL,
        "examples" jsonb NOT NULL DEFAULT '[]',
        "difficulty" text CHECK ("difficulty" IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'beginner',
        "tags" jsonb NOT NULL DEFAULT '[]',
        "audio_url" varchar(255),
        CONSTRAINT "vocabulary_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create vocabulary_progress table
    this.addSql(`
      CREATE TABLE "vocabulary_progress" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "vocabulary_id" uuid NOT NULL,
        "mastery_level" int NOT NULL DEFAULT 0,
        "last_reviewed" timestamptz NOT NULL DEFAULT now(),
        "next_review" timestamptz NOT NULL DEFAULT now(),
        "correct_attempts" int NOT NULL DEFAULT 0,
        "total_attempts" int NOT NULL DEFAULT 0,
        "is_mastered" boolean NOT NULL DEFAULT false,
        CONSTRAINT "vocabulary_progress_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create conversation_session table
    this.addSql(`
      CREATE TABLE "conversation_session" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "scenario" varchar(255) NOT NULL,
        "messages" jsonb NOT NULL DEFAULT '[]',
        "duration" int NOT NULL DEFAULT 0,
        "feedback" jsonb NOT NULL DEFAULT '{}',
        "is_completed" boolean NOT NULL DEFAULT false,
        CONSTRAINT "conversation_session_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign key constraints
    this.addSql(`
      ALTER TABLE "vocabulary_progress" 
      ADD CONSTRAINT "vocabulary_progress_user_id_foreign" 
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    this.addSql(`
      ALTER TABLE "vocabulary_progress" 
      ADD CONSTRAINT "vocabulary_progress_vocabulary_id_foreign" 
      FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    this.addSql(`
      ALTER TABLE "conversation_session" 
      ADD CONSTRAINT "conversation_session_user_id_foreign" 
      FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    // Add indexes for better performance
    this.addSql(`CREATE INDEX "user_email_idx" ON "user" ("email");`);
    this.addSql(`CREATE INDEX "user_proficiency_level_idx" ON "user" ("proficiency_level");`);
    
    this.addSql(`CREATE INDEX "vocabulary_word_idx" ON "vocabulary" ("word");`);
    this.addSql(`CREATE INDEX "vocabulary_difficulty_idx" ON "vocabulary" ("difficulty");`);
    
    this.addSql(`CREATE INDEX "vocabulary_progress_user_id_idx" ON "vocabulary_progress" ("user_id");`);
    this.addSql(`CREATE INDEX "vocabulary_progress_vocabulary_id_idx" ON "vocabulary_progress" ("vocabulary_id");`);
    this.addSql(`CREATE INDEX "vocabulary_progress_next_review_idx" ON "vocabulary_progress" ("next_review");`);
    this.addSql(`CREATE INDEX "vocabulary_progress_is_mastered_idx" ON "vocabulary_progress" ("is_mastered");`);
    
    this.addSql(`CREATE INDEX "conversation_session_user_id_idx" ON "conversation_session" ("user_id");`);
    this.addSql(`CREATE INDEX "conversation_session_scenario_idx" ON "conversation_session" ("scenario");`);
    this.addSql(`CREATE INDEX "conversation_session_is_completed_idx" ON "conversation_session" ("is_completed");`);

    // Add unique constraint for user-vocabulary combination
    this.addSql(`
      ALTER TABLE "vocabulary_progress" 
      ADD CONSTRAINT "vocabulary_progress_user_vocabulary_unique" 
      UNIQUE ("user_id", "vocabulary_id");
    `);
  }

  async down(): Promise<void> {
    // Drop foreign key constraints first
    this.addSql(`ALTER TABLE "vocabulary_progress" DROP CONSTRAINT "vocabulary_progress_user_id_foreign";`);
    this.addSql(`ALTER TABLE "vocabulary_progress" DROP CONSTRAINT "vocabulary_progress_vocabulary_id_foreign";`);
    this.addSql(`ALTER TABLE "conversation_session" DROP CONSTRAINT "conversation_session_user_id_foreign";`);
    
    // Drop tables in reverse order
    this.addSql(`DROP TABLE IF EXISTS "conversation_session";`);
    this.addSql(`DROP TABLE IF EXISTS "vocabulary_progress";`);
    this.addSql(`DROP TABLE IF EXISTS "vocabulary";`);
    this.addSql(`DROP TABLE IF EXISTS "user";`);
  }
}
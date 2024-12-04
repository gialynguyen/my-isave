import { BaseEntity } from '$lib/postgres-orm';
import { Embeddable, Embedded, Entity, Property } from '@mikro-orm/core';

@Embeddable()
export class ReminderRepeatSettings {
  @Property({
    nullable: true
  })
  repeatEvery?: number;

  @Property()
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Property({
    nullable: true
  })
  repeatOn?: string;

  @Property({
    nullable: true
  })
  repeatEnds?: string;

  @Property({
    nullable: true
  })
  repeatEndsOn?: Date;
}

@Entity({
  tableName: 'reminder'
})
export class ReminderEntity extends BaseEntity {
  @Property()
  title!: string;

  @Property({
    nullable: true
  })
  description?: string;

  @Property({
    nullable: true,
    type: 'timestamp'
  })
  dueDate?: Date;

  @Property({
    nullable: true,
    type: 'timestamp'
  })
  dueTime?: Date;

  @Embedded(() => ReminderRepeatSettings, {
    nullable: true
  })
  repeatSettings?: ReminderRepeatSettings;

  @Property({
    nullable: true
  })
  notificationTime?: Date;

  @Property()
  isCompleted: boolean = false;

  @Property({
    nullable: true
  })
  completedAt?: Date;
}

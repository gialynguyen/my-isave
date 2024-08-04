import { BaseEntity } from '$lib/postgres-orm';
import { Entity, Property } from '@mikro-orm/core';

@Entity({
  tableName: 'task'
})
export class TaskEntity extends BaseEntity {
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

  @Property()
  isCompleted: boolean = false;

  @Property({
    nullable: true
  })
  completedAt?: Date;
}

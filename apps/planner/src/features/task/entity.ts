import { BaseEntity } from '$lib/postgres-orm';
import { BeforeCreate, Collection, Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { generateShortId } from './utils/short-id';

@Entity({
  tableName: 'task'
})
export class TaskEntity extends BaseEntity {
  @Property({ unique: true })
  shortId!: string;

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

  @ManyToOne(() => TaskEntity, { nullable: true })
  parentTask?: TaskEntity;

  @OneToMany(() => TaskEntity, (task) => task.parentTask, { orphanRemoval: true })
  subTasks = new Collection<TaskEntity>(this);

  @BeforeCreate()
  generateShortId() {
    this.shortId = generateShortId();
  }
}

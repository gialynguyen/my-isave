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

  @Property({
    index: true
  })
  isCompleted: boolean = false;

  @Property({
    nullable: true
  })
  completedAt?: Date;

  @Property({
    index: true
  })
  isArchived: boolean = false;

  @Property({
    nullable: true
  })
  archivedAt?: Date;

  @Property({
    nullable: true
  })
  deletedAt?: Date;

  @Property({
    index: true
  })
  isDeleted: boolean = false;

  @ManyToOne(() => TaskEntity, { nullable: true, index: true, deleteRule: 'cascade' })
  parentTask?: TaskEntity;

  @OneToMany(() => TaskEntity, (task) => task.parentTask, { orphanRemoval: true })
  subTasks = new Collection<TaskEntity>(this);

  @BeforeCreate()
  generateShortId() {
    this.shortId = generateShortId();
  }
}

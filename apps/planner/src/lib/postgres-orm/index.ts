import { PrimaryKey, Property, QueryOperator } from '@mikro-orm/core';

export abstract class BaseEntity {
  @PrimaryKey({
    type: 'uuid',
    defaultRaw: 'gen_random_uuid()'
  })
  id!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}

export type WhereOperator = typeof QueryOperator;

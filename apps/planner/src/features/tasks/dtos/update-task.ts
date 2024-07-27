import { Type, type Static } from '@sinclair/typebox';
import { createTaskPayloadDto } from './create-task';

export const updateTaskDto = Type.Composite([
  Type.Partial(createTaskPayloadDto),
  Type.Object({
    isCompleted: Type.Optional(Type.Boolean())
  })
]);

export type UpdateTaskDto = Static<typeof updateTaskDto>;

import { Type, type Static } from '@sinclair/typebox';
import { createTaskPayloadDto } from './create-task';

export const updateTaskPayloadDto = Type.Composite([
  Type.Partial(createTaskPayloadDto),
  Type.Object({
    isCompleted: Type.Optional(Type.Boolean())
  })
]);

export type UpdateTaskPayloadDto = Static<typeof updateTaskPayloadDto>;

import { Type, type Static } from '@sinclair/typebox';

export const createSubTaskPayloadDto = Type.Object({
  title: Type.String({
    minLength: 1
  }),
  description: Type.String({
    default: ''
  }),
  dueDate: Type.Optional(Type.String())
});

export const createTaskPayloadDto = Type.Object({
  title: Type.String({
    minLength: 1
  }),
  description: Type.String({
    default: ''
  }),
  dueDate: Type.Optional(Type.String()),
  parentTaskId: Type.Optional(Type.String()),
  subTasks: Type.Optional(Type.Array(createSubTaskPayloadDto))
});

export type CreateSubTaskPayload = Static<typeof createSubTaskPayloadDto>;
export type CreateTaskPayload = Static<typeof createTaskPayloadDto>;

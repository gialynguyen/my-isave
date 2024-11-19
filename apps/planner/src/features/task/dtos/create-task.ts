import { Kind, Type, type Static } from '@sinclair/typebox';

export const createTaskPayloadDto = Type.Object({
  title: Type.String({
    minLength: 1
  }),
  description: Type.String({
    default: ''
  }),
  dueDate: Type.Optional(Type.String())
});

export type CreateTaskPayload = Static<typeof createTaskPayloadDto>;

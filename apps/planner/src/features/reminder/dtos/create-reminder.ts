import { StringEnum } from '$lib/typebox/extended';
import { Type, type Static } from '@sinclair/typebox';

export const createReminderPayloadDto = Type.Object({
  title: Type.String({
    minLength: 1
  }),

  description: Type.String({
    default: ''
  }),

  dueDate: Type.Optional(Type.String()),

  dueTime: Type.Optional(Type.String()),

  repeatSettings: Type.Optional(
    Type.Object({
      repeatEvery: Type.Optional(Type.Number()),
      repeatType: Type.Optional(StringEnum(['daily', 'weekly', 'monthly', 'yearly'])),
      repeatOn: Type.Optional(Type.String()),
      repeatEnds: Type.Optional(Type.String()),
      repeatEndsOn: Type.Optional(Type.String())
    })
  )
});

export type CreateReminderPayload = Static<typeof createReminderPayloadDto>;

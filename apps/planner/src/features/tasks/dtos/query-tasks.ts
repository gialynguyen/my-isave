import { PaginationQuery } from '$lib/typebox/extended';
import { Type } from '@sinclair/typebox';

export enum DueDatePreset {
  'today' = 'today',
  'tomorrow' = 'tomorrow',
  'thisWeek' = 'thisWeek',
  'nextWeek' = 'nextWeek',
  'thisMonth' = 'thisMonth'
}

export const queryTasksConditionsDto = Type.Intersect([
  PaginationQuery,
  Type.Object({
    timezone: Type.String(),
    dueDate: Type.Optional(
      Type.Union([
        Type.Enum(DueDatePreset),
        Type.Object({
          from: Type.Number(),
          to: Type.Number()
        })
      ])
    )
  })
]);

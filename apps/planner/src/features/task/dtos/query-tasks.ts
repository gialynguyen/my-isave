import { CursorQuery, PaginationQuery } from '$lib/typebox/extended';
import { Type, type Static } from '@sinclair/typebox';

export enum DueDatePreset {
  'today' = 'today',
  'tomorrow' = 'tomorrow',
  'thisWeek' = 'thisWeek',
  'nextWeek' = 'nextWeek',
  'thisMonth' = 'thisMonth'
}

export const queryTasksConditionsDto = Type.Composite([
  Type.Partial(PaginationQuery),
  Type.Partial(CursorQuery),
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

export type QueryTasksConditionsDto = Static<typeof queryTasksConditionsDto>;

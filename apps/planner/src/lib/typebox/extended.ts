import { Type } from '@sinclair/typebox';

export const PaginationQuery = Type.Object({
  page: Type.Union([Type.String(), Type.Number()]),
  limit: Type.Union([Type.String(), Type.Number()])
});

export const CursorQuery = Type.Object({
  // forward pagination
  after: Type.String(),
  first: Type.Union([Type.String(), Type.Number()]),

  // backward pagination
  before: Type.String(),
  last: Type.Union([Type.String(), Type.Number()])
});

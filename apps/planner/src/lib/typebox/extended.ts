import { Type } from '@sinclair/typebox';

export const PaginationQuery = Type.Object({
  page: Type.Number(),
  limit: Type.Number()
});

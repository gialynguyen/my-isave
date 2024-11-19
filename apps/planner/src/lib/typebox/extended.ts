import { Kind, Type, TypeRegistry } from '@sinclair/typebox';

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

// StringEnum
TypeRegistry.Set('StringEnum', (schema: { enum: string[] }, value: unknown) => {
  return typeof value === 'string' && schema.enum.includes(value);
});

export const StringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({
    [Kind]: 'StringEnum',
    type: 'string',
    enum: values
  });

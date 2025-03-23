import type { Static, TSchema } from '@sinclair/typebox';
import { type ValueError } from '@sinclair/typebox/value';
import type { Context, Env, Input, MiddlewareHandler, ValidationTargets } from 'hono';
import { validator as openAPIValidator } from 'hono-openapi/typebox';

type Hook<T, E extends Env, P extends string> = (
  result: { success: true; data: T } | { success: false; errors: ValueError[] },
  c: Context<E, P>
) => Response | Promise<Response> | void;

type HasUndefined<T> = undefined extends T ? true : false;

export function validator<
  T extends TSchema,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  In = Static<T>,
  Out = Static<T>,
  I extends Input = {
    in: HasUndefined<In> extends true
      ? {
          [K in Target]?: K extends 'json'
            ? In
            : HasUndefined<keyof ValidationTargets[K]> extends true
              ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
              : { [K2 in keyof In]: ValidationTargets[K][K2] };
        }
      : {
          [K in Target]: K extends 'json'
            ? In
            : HasUndefined<keyof ValidationTargets[K]> extends true
              ? { [K2 in keyof In]?: ValidationTargets[K][K2] }
              : { [K2 in keyof In]: ValidationTargets[K][K2] };
        };
    out: { [K in Target]: Out };
  },
  V extends I = I
>(target: Target, schema: T, hook?: Hook<Static<T>, E, P>): MiddlewareHandler<E, P, V> {
  // @ts-expect-error not typed well
  return openAPIValidator(target, schema, hook);
}

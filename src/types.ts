import {
  AppRoute,
  AppRouteMutation,
  PathParamsFromUrl,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import { Simplify } from 'type-fest';
import { ZodTypeAny, z } from 'zod';

export type AppRouter = {
  [key: string]: AppRoute;
};

type ApiResponse<T> = {
  [K in keyof T]: {
    status: K;
    body: ZodInferOrType<T[K]>;
  };
}[keyof T];

export type ResponseShape<R extends AppRoute> = Promise<
  ApiResponse<Simplify<R['responses']>>
>;

export type ContractualController<R extends AppRouter> = Simplify<{
  [k in keyof R]: (args: ArgsShape<R[k]>) => ResponseShape<R[k]>;
}>;

export interface ContractConstructor<R extends AppRouter> {
  new (...args: unknown[]): ContractualController<R>;
}

type BodyWithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

export type ArgsShape<Route extends AppRoute> = Simplify<{
  params: PathParamsFromUrl<Route>;
  body: Route extends AppRouteMutation
    ? BodyWithoutFileIfMultiPart<Route>
    : never;
  query: Route['query'] extends ZodTypeAny ? z.output<Route['query']> : never;
}>;

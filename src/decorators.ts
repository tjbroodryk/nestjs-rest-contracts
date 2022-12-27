import { Controller, Delete, ExecutionContext, Get, HttpException, Patch, Post, Put, UseInterceptors, applyDecorators, createParamDecorator } from "@nestjs/common";
import { ApiRouteInterceptor } from "./interceptors";
import { AppRouter, ArgsShape, ContractConstructor } from "./types";
import { AppRoute, checkZodSchema } from "@ts-rest/core";
import { Request } from 'express-serve-static-core';

export const ApiDecorator = <T extends AppRoute>(contract: T) =>
  createParamDecorator(
    (_: unknown, ctx: ExecutionContext): ArgsShape<T> => {
      const req: Request = ctx.switchToHttp().getRequest();

      const queryResult = checkZodSchema(req.query, contract.query);

      if (!queryResult.success) {
        throw new HttpException('Invalid query params', 400, {
          cause: queryResult.error as Error,
        });
      }

      const bodyResult = checkZodSchema(
        req.body,
        contract.method === 'GET' ? null : contract.body,
      );

      if (!bodyResult.success) {
        throw new HttpException('Invalid request body', 400, {
          cause: bodyResult.error as Error,
        });
      }

      const pathParamsResult = checkZodSchema(req.params, contract.pathParams, {
        passThroughExtraKeys: true,
      });

      if (!pathParamsResult.success) {
        throw new HttpException('Invalid path params', 400, {
          cause: pathParamsResult.error as Error,
        });
      }

      return {
        query: queryResult.data,
        params: pathParamsResult.data,
        body: bodyResult.data,
      } as ArgsShape<T>;
    },
  )();

const RouteDecorator = <T extends AppRoute>(contract: T) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const origional = descriptor.value;
    Api(contract)(target, propertyKey, descriptor);
    ApiDecorator(contract)(target.prototype, propertyKey, 0);
    descriptor.value = function(...args: unknown[]) {
      return origional.apply(target, ...args);
    };
  };
};

export const ContractController = <T extends AppRouter>(contract: T) => {
  return (target: ContractConstructor<typeof contract>) => {
    const routes = Object.keys(contract);

    for (const route of routes) {
      const routeContract = contract[route];
      const desc = Object.getOwnPropertyDescriptor(target.prototype, route)!;

      RouteDecorator(routeContract)(target, route, desc);
    }
    return Controller()(target as any);
  };
};

const getMethodDecorator = (appRoute: AppRoute) => {
  switch (appRoute.method) {
    case 'DELETE':
      return Delete(appRoute.path);
    case 'GET':
      return Get(appRoute.path);
    case 'POST':
      return Post(appRoute.path);
    case 'PATCH':
      return Patch(appRoute.path);
    case 'PUT':
      return Put(appRoute.path);
    default:
      throw new Error('Unsupported method')
  }
};

export const Api = (appRoute: AppRoute): MethodDecorator => {
  const methodDecorator = getMethodDecorator(appRoute);

  return applyDecorators(methodDecorator, UseInterceptors(ApiRouteInterceptor));
};

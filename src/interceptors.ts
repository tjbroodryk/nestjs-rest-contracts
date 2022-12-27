import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { Response } from 'express-serve-static-core';

@Injectable()
export class ApiRouteInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map(value => {
        if (
          typeof value === 'object' &&
          typeof value.status === 'number' &&
          value.body !== undefined
        ) {
          res.status(value.status);
          return value.body;
        }

        return value;
      }),
    );
  }
}
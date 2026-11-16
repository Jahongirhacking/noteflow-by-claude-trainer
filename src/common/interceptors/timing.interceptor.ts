import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { finalize, Observable } from "rxjs";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  logger = new Logger("Timing Interceptor");
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const res = context.switchToHttp().getResponse<Response>();
    const startTime = new Date();
    return next.handle().pipe(
      finalize(() => {
        res.setHeader(
          "X-Response-Time",
          `${Number(new Date()) - Number(startTime)}ms`,
        );
      }),
    );
  }
}

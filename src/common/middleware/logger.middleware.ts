import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger = new Logger("Middleware");
  use(req: Request, res: Response, next: (error?: any) => void) {
    this.logger.log(`${req.method} ${req.originalUrl || req.url}`);

    const startTime = new Date();
    res.on("finish", () => {
      this.logger.log(
        `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${Number(new Date()) - Number(startTime)}ms`,
      );
    });

    next();
  }
}

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_property: string, _ctx: ExecutionContext) => {
    const user = _ctx.switchToHttp().getRequest().user;
    return _property ? user?.[_property] : user;
  },
);

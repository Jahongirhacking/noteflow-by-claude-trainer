import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { UserRole } from '../../src/users/user-role.enum';

// Sinov uchun yasalgan controller: guard metadata'ni haqiqiy @Roles() dekoratoridan o'qiydi.
class FakeController {
  @Roles(UserRole.ADMIN)
  adminOnly() {}

  @Roles(UserRole.ADMIN, UserRole.USER)
  anyRole() {}

  open() {}
}

function contextFor(handler: () => void, user?: { role: UserRole }): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => FakeController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

/** Guard false qaytarsa ham, ForbiddenException tashlasa ham — "ruxsat yo'q" deb hisoblaymiz. */
function isAllowed(guard: RolesGuard, ctx: ExecutionContext): boolean {
  try {
    return guard.canActivate(ctx) as boolean;
  } catch (e) {
    if (e instanceof ForbiddenException) return false;
    throw e;
  }
}

describe('[M3] RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const proto = FakeController.prototype;

  it("@Roles() yo'q bo'lsa — hamma o'tadi", () => {
    expect(isAllowed(guard, contextFor(proto.open, { role: UserRole.USER }))).toBe(true);
  });

  it("ADMIN talab qilinsa va user ADMIN bo'lsa — o'tadi", () => {
    expect(isAllowed(guard, contextFor(proto.adminOnly, { role: UserRole.ADMIN }))).toBe(true);
  });

  it("ADMIN talab qilinsa va user USER bo'lsa — o'tmaydi", () => {
    expect(isAllowed(guard, contextFor(proto.adminOnly, { role: UserRole.USER }))).toBe(false);
  });

  it("bir nechta rol ruxsat etilgan bo'lsa — ulardan biri yetarli", () => {
    expect(isAllowed(guard, contextFor(proto.anyRole, { role: UserRole.USER }))).toBe(true);
  });

  it("request.user bo'lmasa — o'tmaydi", () => {
    expect(isAllowed(guard, contextFor(proto.adminOnly, undefined))).toBe(false);
  });
});

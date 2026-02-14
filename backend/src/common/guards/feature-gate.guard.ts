import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature requirement set - allow
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const subscription = request.user?.subscription;

    // No subscription context (legacy store or guard not applied) - allow
    if (!subscription) {
      return true;
    }

    const features = subscription.plan.features;
    if (!features[requiredFeature]) {
      throw new ForbiddenException(
        `Your current plan (${subscription.plan.name}) does not include this feature. Please upgrade to access it.`,
      );
    }

    return true;
  }
}

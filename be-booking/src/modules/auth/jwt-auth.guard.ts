import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // optionally extend to attach the request user
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

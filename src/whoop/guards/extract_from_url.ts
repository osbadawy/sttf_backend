import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class ExtractFromUrlGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const queryString = url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);

    if (params.has('access_token')) {
      request.headers['authorization'] = `Bearer ${params.get('access_token')}`;
    } else {
      throw new UnauthorizedException('Missing access token');
    }

    return true;
  }
}
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permitir acceso
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles) {
      return false; // Si no hay usuario o roles, denegar acceso
    }
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    return requiredRoles.some(role => 
      user.roles.some(userRole => userRole.nombre === role)
    );
  }
}
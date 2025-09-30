import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function getRoleFlags(user: any) {
  let roles: string[] = [];
  if (Array.isArray(user?.roles)) {
    roles = user.roles.map(r => typeof r === 'string' ? r : r.nombre);
  }
  return {
    isDocente: roles.includes('Docente'),
    isInstructor: roles.includes('Instructor'),
    isJefe: roles.includes('Jefe de academia'),
    isAdmin: roles.includes('Admin'),
  };
}

@Injectable()
export class RolesFlagsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      map(data => {
        // Si la respuesta tiene rows (paginación), agrega las banderas al nivel raíz
        if (data && Array.isArray(data.rows)) {
          return {
            ...data,
            ...getRoleFlags(user),
          };
        }
        // Si la respuesta es un array directo
        if (Array.isArray(data)) {
          return {
            rows: data,
            ...getRoleFlags(user),
          };
        }
        // Si la respuesta es un objeto único
        return {
          ...data,
          ...getRoleFlags(user),
        };
      }),
    );
  }
}
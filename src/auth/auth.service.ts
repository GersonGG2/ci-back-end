import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(payload: any) {
    // Busca usuario por auth0_id
    let user = await this.usersService.findByAuth0Id(payload.sub);
    
    // Si no existe, crear nuevo usuario
    if (!user) {
      user = await this.usersService.create({
        auth0_id: payload.sub,
        email: payload.email,
        nombre: payload.given_name || payload.name || '',
        apellidos: payload.family_name || '',
      });
    }
    
    return user;
  }
}
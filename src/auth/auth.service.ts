import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async getUserInfo(accessToken: string) {
    try {
      const userInfoUrl = `https://${this.configService.get('AUTH0_DOMAIN')}/userinfo`;
      const response = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información de usuario:', error);
      return null;
    }
  }

  async findOrCreateUser(auth0User: any, accessToken?: string) {
    console.log('Auth0User en findOrCreateUser:', auth0User);

    // Extraer auth0Id
    const auth0Id = auth0User.auth0Id || auth0User.sub;
    
    // Buscar usuario por auth0_id
    let user = await this.usersRepository.findOne({
      where: { auth0_id: auth0Id },
    });

    // Si el usuario existe, devolverlo
    if (user) {
      console.log('Usuario encontrado:', user);
      return user;
    }

    // Si tenemos accessToken, intentar obtener más información
    let email = auth0User.email;
    let nombre = auth0User.nombre || 'Usuario';
    let apellidos = auth0User.apellidos || 'Nuevo';

    if (accessToken) {
      const userInfo = await this.getUserInfo(accessToken);
      if (userInfo) {
        console.log('UserInfo obtenido:', userInfo);
        email = userInfo.email || email;
        nombre = userInfo.name || userInfo.nickname || nombre;
        apellidos = userInfo.family_name || apellidos;
      }
    }

    // Si no hay email, usar el fallback
    if (!email) {
      email = `${auth0Id.split('|')[1]}@example.com`;
    }

    console.log(`Creando usuario con email: ${email}, nombre: ${nombre}`);

    // Crear nuevo usuario
    const newUser = this.usersRepository.create({
      auth0_id: auth0Id,
      email: email,
      nombre: nombre,
      apellidos: apellidos,
      estado: true,
    });

    // Guardar en DB
    const savedUser = await this.usersRepository.save(newUser);
    
    // Asignar rol "Docente" (ID 2)
    await this.usersRepository.query(
      'INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)',
      [savedUser.id, 2]
    );
    
    return savedUser;
  }
}
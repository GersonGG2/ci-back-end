import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from '../users/dto/register.dto';
import { getRoleFlags } from 'src/common/interceptors/roles-flags.interceptor';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      email: registerDto.email,
      nombre: registerDto.nombre,
      apellidos: registerDto.apellidos,
      password: hashedPassword,
      estado: true,
    });

    // Asignar múltiples roles si existen, si no asigna Docente por defecto
    if (registerDto.roles && registerDto.roles.length > 0) {
      await this.usersService.setRoles(newUser.id, registerDto.roles);
    } else {
      await this.usersService.assignRole(newUser.id, 2); // Docente por defecto
    }

    const userWithRoles = await this.usersService.findOneWithRoles(newUser.id);

    const { password, ...userResponse } = userWithRoles;
    return userResponse;
  }

  async login(loginDto: LoginDto) {
    console.log('Intento de login para email:', loginDto.email);

    // Buscar usuario por email
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      console.log('Error: Usuario no encontrado');
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    console.log('Email en DB:', user.email);
    console.log('Contraseña hash en DB:', user.password);
    console.log('Contraseña proporcionada:', loginDto.password);
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    console.log('¿Contraseña válida?:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Error: Contraseña inválida');

      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Cargar roles
    const userWithRoles = await this.usersService.findOneWithRoles(user.id);

    // Crear payload para el token JWT
    const roles = userWithRoles.roles.map((role) => role.nombre);
    const payload = {
      sub: user.id,
      email: user.email,
      roles: roles,
    };

    // Generar token JWT y devolver respuesta sin password
    const { password, ...userWithoutPassword } = userWithRoles;
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...userWithoutPassword,
      },
      ...getRoleFlags(userWithRoles), // <-- agrega las banderas aquí
    };
  }

  async validateUser(id: number) {
    return this.usersService.findOne(id);
  }


  
}

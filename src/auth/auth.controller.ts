import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterDto } from './dto/register_old.dto';
import { UsersService } from 'src/users/users.service';
import { RolesFlagsInterceptor } from 'src/common/interceptors/roles-flags.interceptor';

interface RequestWithUser {
  user: any;
}

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) // Para excluir campos como password
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @UseInterceptors(RolesFlagsInterceptor)
  async login(@Body() loginDto: LoginDto, @Req() req) {
    // Asigna el usuario al request para que el interceptor lo pueda leer
    const result = await this.authService.login(loginDto);
    req.user = result.user;
    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getProfile(@Req() req: RequestWithUser) {
    // Busca el usuario completo por el ID del token
    const userId = req.user.sub || req.user.userId;
    const userComplete = await this.usersService.findOneWithRoles(userId);

    return {
      userId: userId,
      email: userComplete.email,
      nombre: userComplete.nombre,
      apellidos: userComplete.apellidos,
      roles: userComplete.roles.map((r) => r.nombre),
    };
  }

  
}

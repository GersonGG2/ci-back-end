import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth0Guard } from './guards/auth0.guard';
import { Request } from 'express';

// Define una interfaz extendida con el user
interface RequestWithUser extends Request {
  user: any;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @UseGuards(Auth0Guard)
  async getProfile(@Req() req: RequestWithUser) {
    console.log('Usuario en request:', req.user);

    // Extraer token de la cabecera
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];

    // Buscar o crear usuario con el token para obtener información adicional
    return await this.authService.findOrCreateUser(req.user, accessToken);
  }
}

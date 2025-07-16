import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // AGREGAR ESTA LÍNEA
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('users') // AGREGAR ESTA LÍNEA
@ApiBearerAuth() // AGREGAR ESTA LÍNEA
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Crear un nuevo usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 400, description: 'Datos de usuario inválidos' }) // AGREGAR ESTA LÍNEA
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todos los usuarios' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' }) // AGREGAR ESTA LÍNEA
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener un usuario por ID' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario encontrado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Actualizar un usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar un usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':userId/roles/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Asignar un rol a un usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Rol asignado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario o rol no encontrado' }) // AGREGAR ESTA LÍNEA
  assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.assignRole(+userId, +roleId);
  }
}
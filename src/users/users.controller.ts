import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // AGREGAR ESTA LÍNEA
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiPaginatedResponse } from 'src/common/decorators/api-response.decorator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { User } from './entities/user.entity';
import { ApiResponse as StandardResponse } from 'src/common/interfaces/pagination-result.interface'; // 👈 Agrega esta línea
import { SetRolesDto } from './dto/set-roles.dto';

@ApiTags('users') // AGREGAR ESTA LÍNEA
@ApiBearerAuth() // AGREGAR ESTA LÍNEA
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Crear un nuevo usuario' }) // AGREGAR ESTA LÍNEA+-
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' }) // AGREGAR E STA LÍNEA
  @ApiResponse({ status: 400, description: 'Datos de usuario inválidos' }) // AGREGAR ESTA LÍNEA
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios con paginación y filtros' })
  @ApiPaginatedResponse(User)
  async findAll(@Query() paginationQuery: PaginationQueryDto): Promise<StandardResponse<any>> {
    const data = await this.usersService.findAllPaginated(paginationQuery);
    return {
      data,
      message: 'Datos encontrados exitosamente',
      status: 200,
    };
  }

  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener un usuario por ID' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario encontrado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Actualizar un usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Eliminar un usuario' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' }) // AGREGAR ESTA LÍNEA
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' }) // AGREGAR ESTA LÍNEA
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }



  @Patch(':userId/roles')
  @ApiOperation({ summary: 'Reemplazar todos los roles de un usuario' })
  @ApiResponse({ status: 200, description: 'Roles actualizados exitosamente' })
  async setRoles(
    @Param('userId') userId: string,
    @Body() setRolesDto: SetRolesDto,
  ) {
    return this.usersService.setRoles(+userId, setRolesDto.roleIds);
  }


}
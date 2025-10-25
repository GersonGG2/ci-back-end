import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginationResult } from '../common/interfaces/pagination-result.interface';
import { PaginationService } from '../common/services/pagination.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private paginationService: PaginationService,
  ) { }

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({ relations: ['roles'] });
  }

  async findAllPaginated(
    paginationQuery: PaginationQueryDto,
    role?: string,
  ): Promise<PaginationResult<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    // Filtro por rol
    if (role) {
      queryBuilder.andWhere('roles.nombre = :role', { role });
    }

    let sortField = paginationQuery.sort ? paginationQuery.sort : 'id';
    if (!sortField.includes('.')) {
      sortField = `user.${sortField}`;
    }

    // TypeORM espera "ASC" | "DESC"
    const order: 'ASC' | 'DESC' =
      paginationQuery.order && paginationQuery.order.toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';
    queryBuilder.orderBy(sortField, order);

    // Cambia aquí: usa searchValue en vez de search
    if (paginationQuery.searchValue) {
      queryBuilder.andWhere(
        '(user.nombre LIKE :search OR user.email LIKE :search OR user.apellidos LIKE :search)',
        { search: `%${paginationQuery.searchValue}%` },
      );
    }

    return this.paginationService.paginate<User>(
      queryBuilder,
      { ...paginationQuery, sort: sortField },
      ['user.nombre', 'user.email', 'user.apellidos'],
    );
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    return user;
  }

  // Método para buscar por email (NECESARIO PARA AUTENTICACIÓN)
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar si el usuario está relacionado con inscripciones
    const inscripciones = await this.dataSource.query(
      'SELECT COUNT(*) as count FROM inscripciones WHERE docente_id = ?',
      [id],
    );

    if (inscripciones[0].count > 0) {
      // Realizar soft delete
      await this.usersRepository.update(id, { estado: false });

      // Lanzar error con código 409 (Conflict)
      throw new ConflictException({
        message: `No se puede eliminar el usuario porque está inscrito en ${inscripciones[0].count} curso(s)`,
        details: {
          inscripciones: inscripciones[0].count,
          userId: id,
          action: 'desactivado',
        },
        softDelete: true,
      });
    }

    // Si no hay restricciones, eliminar físicamente
    return this.usersRepository.remove(user);
  }

  async setRoles(userId: number, roleIds: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // Elimina todos los roles actuales
      await queryRunner.manager.query(
        `DELETE FROM usuarios_roles WHERE usuario_id = ?`,
        [userId],
      );

      // Asigna los nuevos roles
      for (const roleId of roleIds) {
        await queryRunner.manager.query(
          `INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)`,
          [userId, roleId],
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(userId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOneWithRoles(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Obtener roles del usuario
    const roles = await this.usersRepository.query(
      `SELECT r.id, r.nombre 
       FROM roles r
       JOIN usuarios_roles ur ON r.id = ur.rol_id
       WHERE ur.usuario_id = ?`,
      [id],
    );

    user.roles = roles;
    return user;
  }

  async assignRole(userId: number, roleId: number): Promise<void> {
    // Verificar si ya tiene este rol
    const hasRole = await this.usersRepository.query(
      'SELECT * FROM usuarios_roles WHERE usuario_id = ? AND rol_id = ?',
      [userId, roleId],
    );

    if (hasRole.length === 0) {
      await this.usersRepository.query(
        'INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)',
        [userId, roleId],
      );
    }
  }
}

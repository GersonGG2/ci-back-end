import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginationResult } from 'src/common/interfaces/pagination-result.interface';
import { PaginationService } from 'src/common/services/pagination.service';

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

  async findAllPaginated(paginationQuery: PaginationQueryDto, role?: string): Promise<PaginationResult<User>> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user').leftJoinAndSelect('user.roles', 'roles');
  
    // Filtro por rol
    if (role) {
      queryBuilder.andWhere('roles.nombre = :role', { role });
    }
  
  let sortField = paginationQuery.sort ? paginationQuery.sort : 'id';
if (!sortField.includes('.')) {
  sortField = `user.${sortField}`;
}

// TypeORM espera "ASC" | "DESC"
const order: "ASC" | "DESC" = paginationQuery.order && paginationQuery.order.toLowerCase() === 'desc' ? "DESC" : "ASC";
queryBuilder.orderBy(sortField, order);
  
    // Cambia aquí: usa searchValue en vez de search
    if (paginationQuery.searchValue) {
      queryBuilder.andWhere(
        '(user.nombre LIKE :search OR user.email LIKE :search OR user.apellidos LIKE :search)',
        { search: `%${paginationQuery.searchValue}%` }
      );
    }
  
    return this.paginationService.paginate<User>(
      queryBuilder,
      { ...paginationQuery, sort: sortField },
      ['user.nombre', 'user.email', 'user.apellidos']
    );
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles']
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async findByAuth0Id(auth0Id: string) {
    const user = await this.usersRepository.findOne({
      where: { auth0_id: auth0Id },
      relations: ['roles']
    });

    if (!user) {
      return null;
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.usersRepository.remove(user);
  }

  async setRoles(userId: number, roleIds: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['roles']
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // Elimina todos los roles actuales
      await queryRunner.manager.query(
        `DELETE FROM usuarios_roles WHERE usuario_id = ?`,
        [userId]
      );

      // Asigna los nuevos roles
      for (const roleId of roleIds) {
        await queryRunner.manager.query(
          `INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (?, ?)`,
          [userId, roleId]
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




}
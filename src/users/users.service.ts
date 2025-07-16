import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({ relations: ['roles'] });
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

  async assignRole(userId: number, roleId: number) {
    // Usamos QueryRunner para hacer esto más eficiente
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Verificar si el usuario existe
      const user = await queryRunner.manager.findOne(User, { 
        where: { id: userId },
        relations: ['roles']
      });
      
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }
      
      // Insertar directamente en la tabla de relación usuarios_roles
      await queryRunner.manager.query(
        `INSERT INTO usuarios_roles (usuario_id, rol_id) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id)`,
        [userId, roleId]
      );
      
      await queryRunner.commitTransaction();
      
      // Devolver el usuario actualizado con sus roles
      return this.findOne(userId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
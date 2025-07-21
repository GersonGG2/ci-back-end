import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @ApiProperty({ example: 1, description: 'ID único del rol' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Admin', description: 'Nombre del rol' })
  @Column({ unique: true, name: 'nombre' }) // 👈 Cambiado a 'nombre' para coincidir con la BD
  name: string;

  // No incluir description porque no existe en tu esquema de BD
  // @Column({ nullable: true })
  // description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;

  @ManyToMany(() => User, user => user.roles)
  users: User[];
}
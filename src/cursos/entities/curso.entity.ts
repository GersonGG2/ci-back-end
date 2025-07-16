import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Periodo } from '../../periodos/entities/periodo.entity';
import { Academia } from '../../academias/entities/academia.entity';
import { Inscripcion } from 'src/inscripciones/entities/inscripcione.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column('text')
  objetivo: string;

  @Column({ name: 'periodo_id' })
  periodoId: number;

  @ManyToOne(() => Periodo, periodo => periodo.cursos)
  @JoinColumn({ name: 'periodo_id' })
  periodo: Periodo;

  @Column({ name: 'academia_id' })
  academiaId: number;

  @ManyToOne(() => Academia, academia => academia.cursos)
  @JoinColumn({ name: 'academia_id' })
  academia: Academia;

  @Column({ name: 'instructor_id' })
  instructorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @Column()
  lugar: string;

  @Column()
  aula: string;

  @Column()
  horas: number;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column()
  dirigido_a: string;

  @Column({ type: 'text', nullable: true })
  prerequisitos: string;

  @Column({
    type: 'enum',
    enum: ['propuesto', 'aprobado', 'rechazado', 'finalizado'],
    default: 'propuesto'
  })
  estado: string;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creador: User;

  @OneToMany(() => Inscripcion, inscripcion => inscripcion.curso)
  inscripciones: Inscripcion[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;
}
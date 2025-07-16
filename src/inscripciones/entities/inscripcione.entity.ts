import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Curso } from '../../cursos/entities/curso.entity';
import { Asistencia } from '../../asistencias/entities/asistencia.entity';
import { Constancia } from '../../constancias/entities/constancia.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('inscripciones')
export class Inscripcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'curso_id' })
  cursoId: number;

  @ManyToOne(() => Curso, curso => curso.inscripciones)
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;

  @Column({ name: 'docente_id' })
  docenteId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'docente_id' })
  docente: User;

  @Column({
    type: 'enum',
    enum: ['inscrito', 'aprobado', 'reprobado', 'cancelado'],
    default: 'inscrito'
  })
  estado: string;

  @Column({ name: 'fecha_inscripcion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaInscripcion: Date;

  @OneToMany(() => Asistencia, asistencia => asistencia.inscripcion)
  asistencias: Asistencia[];

  @OneToOne(() => Constancia, constancia => constancia.inscripcion)
  constancia: Constancia;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Content } from '../content/entities/content.entity';

@Entity('cast_members')
export class CastMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tmdbId: number;               // ID aus TMDB (optional)

  @Column()
  name: string;

  @Column()
  character: string;

  @Column()
  profilePathUrl: string;

  @ManyToOne(() => Content, content => content.cast, {
    onDelete: 'CASCADE',
    cascade: ['insert','update']   // Cascade auch hier auf der Many-Side
  })
  @JoinColumn({ name: 'content_id' })
  content: Content;
}
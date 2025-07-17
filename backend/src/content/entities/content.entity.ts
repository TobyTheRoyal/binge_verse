import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Watchlist } from '../../watchlist/entities/watchlist.entity';
import { Rating } from '../../ratings/entities/ratings.entity';
import { CastMember } from '../../cast-member/cast-member.entity';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tmdb_id' }) // Mappt auf Datenbankspalte tmdb_id
  tmdbId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  releaseYear: number;

  @Column({ nullable: true })
  poster: string;

  @Column({ nullable: true, type: 'float' })
  imdbRating: number | null | undefined;

  @Column({ nullable: true, type: 'float' })
  rtRating: number | null | undefined;

  @Column({ nullable: true })
  language: string; // Add this if not present

  @OneToMany(() => Watchlist, (watchlist) => watchlist.content)
  watchlist: Watchlist[];

  @OneToMany(() => Rating, (rating) => rating.content)
  ratings: Rating[];

  @Column('text', { array: true, nullable: true})
  genres: string[];

  @Column('text', { array: true, nullable: true })
  providers: string[] | null;

  @Column({ nullable: true })
  overview: string;

  @OneToMany(() => CastMember, cm => cm.content, {
    cascade: ['insert', 'update'],  // Insert/Update der CastMembers in einem Rutsch
    eager: true                     // immer mitladen (optional)
  })
  cast: CastMember[];
}
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Watchlist } from '../../watchlist/entities/watchlist.entity';
import { Rating } from '../../ratings/entities/ratings.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => Watchlist, (watchlist) => watchlist.user)
  watchlist: Watchlist[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];
}


import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from "typeorm"
import { Profile } from "./profile.entity"
import { Post } from "src/posts/post.entity"

@Entity({ name: 'usuarios' })
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    username: string

    @Column()
    password: string
    
    @Column({ nullable: true })
    authStrategy: string

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Profile

    @OneToMany(() => Post, post => post.author)
    posts: Post[]
}
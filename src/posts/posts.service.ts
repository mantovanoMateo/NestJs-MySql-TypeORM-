import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {

    constructor(
        @InjectRepository(Post) private postRespository: Repository<Post>,
        private usersService: UsersService
    ) { }

    async createPost(post: CreatePostDto) {
        const userFound = await this.usersService.getUser(post.authorId);

        if (!userFound) {
            return new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const newPost = this.postRespository.create(post);
        
        return this.postRespository.save(newPost);
    }

    getPosts() {
        return this.postRespository.find({
            relations: ['author']
        });
     }
}

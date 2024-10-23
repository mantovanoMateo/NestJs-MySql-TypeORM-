import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {

    constructor(private postService: PostsService){

    }

    @Post()
    createPost(@Body() post: CreatePostDto){
        return this.postService.createPost(post)
    }

    @Post('/test')
    testPost(){
        return 'post test working'
    }

    @Patch('/test')
    testPatch(){
        return 'patch test working'
    }

    @Delete('/test')
    testDelete(){
        return 'delete test working'
    }

    @Get()
    getPosts(){
        return this.postService.getPosts()
    }
}

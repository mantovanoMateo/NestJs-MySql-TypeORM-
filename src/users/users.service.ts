import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { Profile } from './profile.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as AWS from 'aws-sdk';
import { PutObjectCommand, S3, ObjectCannedACL, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { ReadStream } from 'fs';
import { promises as fsPromises } from 'fs';
import * as fs from 'fs';

@Injectable()
export class UsersService {

    private s3: S3;

    constructor(@InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        private readonly mailService: MailerService) {
        this.s3 = new S3({
            region: 'sa-east-1',
            credentials: {
                accessKeyId: 'AKIA6GBMHJSJWC2YTTYO',
                secretAccessKey: '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',
            }
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const key = uuidv4();

        const uploadParams = {
            Bucket: 'nest-js-s3-bucket',
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: ObjectCannedACL.public_read,
        };

        const command = new PutObjectCommand(uploadParams);
        await this.s3.send(command);

        // 22d19481-b512-4187-8dd5-a4bb6ecc2dae Key de un objeto ya subido

        // Retorna la URL pública del archivo
        return `https://${uploadParams.Bucket}.s3.sa-east-1.amazonaws.com/${uploadParams.Key}`;
    }

    async deleteFile(fileKey: string) {
        if (!fileKey) {
            throw new Error('No se proporcionó el archivo a eliminar.');
        }

        const deleteParams = {
            Bucket: 'nest-js-s3-bucket',  // Reemplaza con el nombre de tu bucket
            Key: fileKey,  // Este es el nombre o key del archivo a eliminar
        };

        const command = new DeleteObjectCommand(deleteParams);
        await this.s3.send(command);

        return `Archivo eliminado: ${fileKey}`;
    }

    async createUser(user: CreateUserDto) {
        const userFound = await this.userRepository.findOne({
            where: {
                username: user.username
            }
        })

        if (userFound) {
            return new HttpException('User already exists', HttpStatus.CONFLICT);
        }

        const newUser = this.userRepository.create(user);
        return this.userRepository.save(newUser);
    }

    sendMail() {
        const message = `Forgot your password? If you didn't forget your password, please ignore this email!`;


        const title = 'Olvidaste tu contraseña?';

        const htmlMessage = "<div style=\"font-family: Arial, sans-serif;height: 100%; background: linear-gradient(to bottom right, #1C284C, #0191C1); margin: 0; padding: 0;\">" +
            "<div style=\"max-width: 600px; margin: 20px auto; color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);\">" +
            "<div style=\"background-color: rgba(255, 255, 255, 0.5); color: #1C284C; padding: 20px;\">" +
            "<h2>" + title + "</h2>" +
            "<p>" + 'Aqui tienes tu codigo de recupero!' + "</p>" +
            "<div style=\"font-size: 24px; text-align: center; font-weight: bold; padding: 10px; background-color: #F01159; border-radius: 5px; margin-bottom: 20px; color: #ffffff;\">" + 'random' + "</div>" +
            "<p>" + 'Por favor no compartas este codigo con nadie, nosotros tampoco te lo pediremos' + "</p>" +
            "<p>" + 'Continua en TiendaParts ingresando el codigo' + "</p>" +
            "<div style=\"margin-top: 20px; text-align: center;\"><hr><small>Este correo electrónico fue generado automáticamente. Por favor, no respondas a este mensaje.</small></div>" +
            "</div>" +
            "</div>" +
            "</div>"

        this.mailService.sendMail({
            from: 'mantovanomateo@gmail.com',
            to: 'mantovanomateo@gmail.com',
            subject: 'How to send Emails with Nodemailer',
            html: htmlMessage
        });
    }

    getUsers() {
        return this.userRepository.find();
    }

    async getUser(id: number) {
        const userFound = await this.userRepository.findOne({
            where: {
                id: id
            },
            relations: {
                profile: true,
                posts: true
            }
        });

        if (!userFound) {
            return new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        return userFound;
    }

    async deleteUser(id: number) {

        const result = await this.userRepository.delete({ id });

        if (result.affected === 0) {
            return new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        return result;
    }

    async updateUser(id: number, user: UpdateUserDto) {
        const userFound = await this.userRepository.findOne({
            where: {
                id: id
            }
        });

        if (!userFound) {
            return new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        this.userRepository.update({ id }, user);
    }

    async createProfile(id: number, profile: CreateProfileDto) {
        const userFound = await this.userRepository.findOne({
            where: {
                id
            }
        })

        if (!userFound) {
            return new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const newProfile = this.profileRepository.create(profile);

        const savedProfile = await this.profileRepository.save(newProfile);

        userFound.profile = savedProfile;

        const savedUser = await this.userRepository.save(userFound);

        return savedUser;
    }

    // async uploadFile(file: Express.Multer.File) {
    //     console.log(file);
    //     const { originalname } = file;

    //     return await this.s3_upload(
    //         file.buffer,
    //         this.AWS_S3_BUCKET,
    //         originalname,
    //         file.mimetype
    //     )
    // }

    // async s3_upload(file, bucket, name, mimetype) {
    //     const params = {
    //         Bucket: bucket,
    //         Key: String(name),
    //         Body: file,
    //         ACL: 'public-read',
    //         ContentType: mimetype,
    //         ContentDisposition: 'inline',
    //         CreateBucketConfiguration: {
    //             LocationConstraint: 'ap-south-1',
    //         },
    //     };

    //     try {
    //         let s3Response = await this.s3.upload(params).promise();
    //         return s3Response;
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }
}

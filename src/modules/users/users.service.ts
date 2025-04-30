import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.UserRepo.create(createUserDto);
    return await this.UserRepo.save(user);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return this.UserRepo.findOne({
      where: { id },
      select: ['firstName', 'lastName', 'avatarUrl'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.UserRepo.findOne({ where: { email } });
    //if (!user) {
    //  throw new NotFoundException(`User with email not found`);
    //}
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

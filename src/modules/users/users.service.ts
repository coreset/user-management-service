import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, QueryFailedError, IsNull, In } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private UserRepo: Repository<User>) {}

  //async create(createUserDto: CreateUserDto) {
  //  const user = this.UserRepo.create(createUserDto);
  //  return await this.UserRepo.save(user);
  //}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.UserRepo.create(createUserDto);

    try {
      const savedUser = await this.UserRepo.save(user);
      return savedUser;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).errno === 1062 // MySQL duplicate entry
      ) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  findAll() {
    return this.UserRepo.find({
      where: { deletedAt: IsNull() },
      relations: ['roles'],
    });
  }

  findOne(id: number): Promise<User | null> {
    return this.UserRepo.findOne({
      where: { id },
      select: ['firstName', 'lastName', 'avatarUrl'],
    });
  }

  findByIdList(idList: number[]): Promise<any> {
    return this.UserRepo.find({
      where: {id : In(idList)}
    });
  }

  async searchAllPaginated(
    name: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    if (name && page && limit) {
      const [items, total] = await this.UserRepo.findAndCount({
        where: { firstName: name },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        data: items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } else if (name && !page && !limit) {
      const item = await this.UserRepo.find({
        where: { firstName: name },
      });
      return item;
    } else {
      throw new BadRequestException(`Search parameters requered `);
    }
  }

  async findById(id: number): Promise<User | null> {
    return this.UserRepo.findOne({ where: { id }, relations: ['roles'] });
  }

  updatePasswordById(userId: number, newHashedPassword: string): Promise<any> {
    return this.UserRepo.update(userId, { password: newHashedPassword });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.UserRepo.findOne({ where: { email } });
    //if (!user) {
    //  throw new NotFoundException(`User with email not found`);
    //}
    return user;
  }

  async restore(id: number) {
    const result = await this.UserRepo.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found or not deleted`);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.UserRepo.findOne({
      where: { id },
    });
    if (!user) {
      throw new BadRequestException('user not available');
    }
    Object.assign(user, updateUserDto);
    return this.UserRepo.save(user);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

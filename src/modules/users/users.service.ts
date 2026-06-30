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
import { Realm } from '../realms/entities/realm.entity';
import { Repository, QueryFailedError, IsNull, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { RealmsService } from '../realms/realms.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly realmsService: RealmsService,
    @InjectRepository(User) private UserRepo: Repository<User>
  ) {}

  //async create(createUserDto: CreateUserDto) {
  //  const user = this.UserRepo.create(createUserDto);
  //  return await this.UserRepo.save(user);
  //}

  async create(createUserDto: CreateUserDto): Promise<User> {

    const realm = await this.realmsService.findOne(createUserDto.realmId);
    if (!realm) {
      throw new NotFoundException('Organization(realm) ID not found');
    }
    const user = this.UserRepo.create({
      username: createUserDto.username ?? createUserDto.email,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      avatarUrl: createUserDto.avatarUrl,
      // @BeforeInsert hashes this value; fall back to a random secret
      // (e.g. social logins that never set a password).
      passwordHash: createUserDto.password ?? randomBytes(16).toString('hex'),
      realm: realm
    });

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

  findOne(id: string): Promise<User | null> {
    return this.UserRepo.findOne({
      where: { id },
      select: ['firstName', 'lastName', 'avatarUrl'],
    });
  }

  findByIdList(idList: string[]): Promise<any> {
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

  async findById(id: string): Promise<User | null> {
    return this.UserRepo.findOne({
      where: { id },
      relations: ['roles', 'realm'],
    });
  }

  updatePasswordById(userId: string, newHashedPassword: string): Promise<any> {
    return this.UserRepo.update(userId, { passwordHash: newHashedPassword });
  }

  /**
   * @see
   */
  findByEmail(email: string, realmId?: string): Promise<User | null> {
    return this.UserRepo.findOne({
      where: { email, ...(realmId ? { realm: { id: realmId } } : {}) },
    });
  }

  /**
   * @see
   */
  findByUsername(username: string, realmId?: string): Promise<User | null> {
    return this.UserRepo.findOne({
      where: { username, ...(realmId ? { realm: { id: realmId } } : {}) },
      relations: ['realm'],
    });
  }

  async restore(id: string) {
    const result = await this.UserRepo.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found or not deleted`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.UserRepo.findOne({
      where: { id },
    });
    if (!user) {
      throw new BadRequestException('user not available');
    }
    Object.assign(user, updateUserDto);
    return this.UserRepo.save(user);
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}

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
import { Repository, QueryFailedError, IsNull, In, Like } from 'typeorm';
import { randomBytes } from 'crypto';
import { RealmsService } from '../realms/realms.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly realmsService: RealmsService,
    @InjectRepository(User) private UserRepo: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto, realmName: string): Promise<User> {
    const realm = await this.realmsService.findByName(realmName);
    if (!realm) {
      throw new NotFoundException(`Realm '${realmName}' not found`);
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
      relations: ['userRealmRoles', 'userRealmRoles.realmRole'],
    });
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'DESC',
    realmId?: string,
    realmName?: string,
    search?: string,
  ): Promise<any> {
    const where: any = { deletedAt: IsNull() };

    // Filter by realm if provided
    if (realmId) {
      where.realm = { id: realmId };
    } else if (realmName) {
      where.realm = { realmName };
    }

    // Search by username or email if provided
    if (search?.trim()) {
      where.username = Like(`%${search}%`);
      // Note: Using Like for simple search; could be improved with full-text search
    }

    const [data, total] = await this.UserRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: order.toUpperCase() as 'ASC' | 'DESC' },
      relations: ['realm'],
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string): Promise<User | null> {
    return this.UserRepo.findOne({ where: { id } });
  }

  findByIdList(idList: string[], realmId?: string): Promise<any> {
    const where: any = { id: In(idList) };
    if (realmId) {
      where.realm = { id: realmId };
    }
    return this.UserRepo.find({ where });
  }

  async searchAllPaginated(
    name: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    if (name && page && limit) {
      const [data, total] = await this.UserRepo.findAndCount({
        where: { firstName: name },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
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
      relations: [
        'userRealmRoles',
        'userRealmRoles.realmRole',
        'userRealmRoles.realmRole.permissions',
        'realm',
        'userClientRoles',
        'userClientRoles.clientRole',
        'userClientRoles.clientRole.permissions',
      ],
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

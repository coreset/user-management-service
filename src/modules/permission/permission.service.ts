import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { In, Repository } from 'typeorm';
import { AppLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly PermissionRepo: Repository<Permission>,
    private readonly logger: AppLoggerService,
  ) {}
  async create(createPermissionDto: CreatePermissionDto): Promise<any> {
    try {
      const existing = await this.PermissionRepo.findOne({
        where: { name: createPermissionDto.name },
        withDeleted: true,
      });

      if (existing) {
        if (existing.deletedAt) {
          this.logger.warn(`Restoring soft-deleted Permission ${createPermissionDto.name}`, PermissionService.name);
          // Restoring the soft-deleted record
          await this.PermissionRepo.restore(existing.id);

          // Optionally update other fields
          const updated = this.PermissionRepo.merge(existing, createPermissionDto);
          const restoredPermission = await this.PermissionRepo.save(updated);
          this.logger.log(`Permission restored successfully: ${restoredPermission.id}`, PermissionService.name);
        } else {
          this.logger.error(
            `Attepmt to create dublicate permission : ${createPermissionDto.name}`,
            PermissionService.name,
          );
          throw new ConflictException(`Permission with this name ${createPermissionDto.name} already exists`);
        }
      }

      const newPermission = this.PermissionRepo.create(createPermissionDto);
      const savedPermission = await this.PermissionRepo.save(newPermission);
      this.logger.log(`Permission saved successfully: ${savedPermission.id}`, PermissionService.name);
      return savedPermission;
    } catch (error) {
      this.logger.error(`Failed to create Permission: ${error.message}`, PermissionService.name);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong while creating the Permission');
    }
  }

  findAll() {
    return this.PermissionRepo.find({
      withDeleted: false,
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} permission`;
  }

  update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: string) {
    return `This action removes a #${id} permission`;
  }

  findByIdList(idList: string[]): Promise<any> {
    return this.PermissionRepo.find({
      where: {id : In(idList)}
    });
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPublicKey } from 'crypto';
import { Realm } from './entities/realm.entity';
import { RealmKey } from './entities/realm-key.entity';
import { CreateRealmDto } from './dto/create-realm.dto';
import { UpdateRealmDto } from './dto/update-realm.dto';
import { generateRealmKeyPair } from '../../common/utils/rsa-key.util';
import { AppLoggerService } from '../../common/logger/logger.service';

@Injectable()
export class RealmsService {
  constructor(
    @InjectRepository(Realm)
    private readonly realmRepo: Repository<Realm>,
    @InjectRepository(RealmKey)
    private readonly realmKeyRepo: Repository<RealmKey>,
    private readonly logger: AppLoggerService,
  ) {}

  async create(createRealmDto: CreateRealmDto): Promise<Realm> {
    const existing = await this.realmRepo.findOne({
      where: { realmName: createRealmDto.realmName },
    });
    if (existing) {
      throw new ConflictException(
        `Realm '${createRealmDto.realmName}' already exists`,
      );
    }

    const realm = await this.realmRepo.save(
      this.realmRepo.create({
        realmName: createRealmDto.realmName,
        displayName: createRealmDto.displayName ?? createRealmDto.realmName,
        isActive: createRealmDto.isActive ?? true,
      }),
    );

    // Auto-generate the realm's signing key pair (Keycloak-style).
    await this.generateActiveKey(realm);

    this.logger.log(
      `Realm '${realm.realmName}' created with id ${realm.id}`,
      RealmsService.name,
    );

    return realm;
  }

  /** Generates and persists a fresh active RSA key pair for a realm. */
  async generateActiveKey(realm: Realm): Promise<RealmKey> {
    const generated = generateRealmKeyPair();
    return this.realmKeyRepo.save(
      this.realmKeyRepo.create({
        realm,
        kid: generated.kid,
        algorithm: generated.algorithm,
        keyType: generated.keyType,
        publicKey: generated.publicKey,
        privateKey: generated.privateKey,
        isActive: true,
      }),
    );
  }

  /**
   * Returns the realm's active RS256 private key for SIGNING access tokens.
   * Used by AuthService.login(). The `kid` is stamped into the JWT header so
   * the verifier knows which key to check against.
   */
  async getActiveSigningKey(
    realmName: string,
  ): Promise<{ kid: string; privateKey: string }> {
    const key = await this.realmKeyRepo.findOne({
      where: { isActive: true, algorithm: 'RS256', realm: { realmName } },
      relations: ['realm'],
      order: { createdAt: 'DESC' },
    });
    if (!key) {
      throw new NotFoundException(
        `No active RS256 signing key found for realm '${realmName}'`,
      );
    }
    return { kid: key.kid, privateKey: key.privateKey };
  }

  /**
   * Returns a realm's public key by its `kid` for VERIFYING access tokens.
   * Used by the JwtRs256Strategy (and, later, the public JWKS endpoint).
   */
  async getPublicKeyByKid(realmName: string, kid: string): Promise<string> {
    const key = await this.realmKeyRepo.findOne({
      where: { kid, realm: { realmName } },
      relations: ['realm'],
    });
    if (!key) {
      throw new NotFoundException(
        `Public key '${kid}' not found for realm '${realmName}'`,
      );
    }
    return key.publicKey;
  }

  /**
   * Builds the realm's public JWKS (JSON Web Key Set) from its active keys.
   * Served at /realms/:realm/protocol/openid-connect/certs so external services
   * (e.g. pawn-backend's jwks-rsa client) can fetch the public keys and verify
   * RS256 access tokens. Only public material is exposed — never the private key.
   */
  async getJwks(realmName: string): Promise<{ keys: Record<string, unknown>[] }> {
    const keys = await this.realmKeyRepo.find({
      where: { isActive: true, algorithm: 'RS256', realm: { realmName } },
      relations: ['realm'],
    });

    const jwks = keys.map((key) => {
      // Node exports a public PEM straight to JWK ({ kty, n, e }) — no extra lib.
      const jwk = createPublicKey(key.publicKey).export({ format: 'jwk' });
      return {
        ...jwk,
        kid: key.kid, // matches the `kid` stamped into each token header
        use: 'sig',
        alg: key.algorithm,
      };
    });

    return { keys: jwks };
  }

  findAll(): Promise<Realm[]> {
    return this.realmRepo.find();
  }

  /** Resolves a realm by its (globally-unique) name; null if not found. */
  findByName(realmName: string): Promise<Realm | null> {
    return this.realmRepo.findOne({ where: { realmName } });
  }

  async findOne(id: string): Promise<Realm> {
    const realm = await this.realmRepo.findOne({ where: { id } });
    if (!realm) {
      throw new NotFoundException(`Realm with id ${id} not found`);
    }
    return realm;
  }

  async update(id: string, updateRealmDto: UpdateRealmDto): Promise<Realm> {
    const realm = await this.findOne(id);
    Object.assign(realm, {
      realmName: updateRealmDto.realmName ?? realm.realmName,
      displayName: updateRealmDto.displayName ?? realm.displayName,
      isActive: updateRealmDto.isActive ?? realm.isActive,
    });
    return this.realmRepo.save(realm);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.realmRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Realm with id ${id} not found`);
    }
    return { message: 'Realm deleted successfully' };
  }
}

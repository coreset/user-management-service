import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; // To load the environment variables
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LoggerModule } from './common/logger/logger.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RealmsModule } from './modules/realms/realms.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UserAttributesModule } from './modules/user-attributes/user-attributes.module';
import { AuditModule } from './common/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
    }),

    // database configuration  //////////////////////////////////////////////////////////
    //TypeOrmModule.forRootAsync({
    //  imports: [ConfigModule],
    //  useFactory: async (configService: ConfigService) => {
    //    const dbConfig = {
    //      type: 'mysql' as const, // Database type
    //      host: configService.get<string>('DB_HOST', 'localhost'),
    //      port: +configService.get<number>('DB_PORT', 3306), // Convert string to number
    //      username: configService.get<string>('DB_USERNAME', 'root'),
    //      password: configService.get<string>('DB_PASSWORD', ''),
    //      database: configService.get<string>('DB_DATABASE', 'test'),
    //      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Path to your entities
    //      synchronize: configService.get('DB_SYNCHRONIZE') === 'true', // Sync database every app startup (development only)
    //    };
    //    console.log("config data ::", dbConfig);
    //    const dataSource = new DataSource(dbConfig);
    //    try {
    //      await dataSource.initialize();
    //      console.log(`Database ${dbConfig.database} connected successfully!`);
    //    } catch (error) {
    //      console.log('Error connecting to the database:', error);
    //      throw error;
    //    }
    //
    //    return dbConfig;
    //  },
    //  inject: [ConfigService],
    //}),
    // end of database configuration \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: +configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'test'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    LoggerModule,
    RealmsModule,
    UsersModule,
    AuthModule,
    RolesModule,
    ClientsModule,
    PermissionModule,
    SettingsModule,
    UserAttributesModule,
    AuditModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

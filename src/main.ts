import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/logger.service';
import { DataSource } from 'typeorm';
import { createSwaggerDocument } from './common/swagger/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // logger config ///////////////////////
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  // end of login config \\\\\\\\\\\\\\\\

  // swagger config ///////////////////////
  createSwaggerDocument(app);
  // end of swagger config \\\\\\\\\\\\\\\\

  // database connection check ///////////
  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    logger.log('Database connection established successfully', 'Bootstrap');
  } else {
    logger.error('Failed to connect to the database', 'Bootstrap');
  }
  // end of database connection check \\\\

  // Enable Global Validation ////////////
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // end \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

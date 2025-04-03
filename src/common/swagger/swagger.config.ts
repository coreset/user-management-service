//import { DocumentBuilder } from '@nestjs/swagger';
//import { SwaggerConfig } from './swagger.interface';
//
//export const swaggerConfig = new DocumentBuilder()
//  .setTitle('User Management Service') // Set the API title
//  .setDescription('The API documentation for User Management System') // Description of the API
//  .setVersion('1.0') // API version
//  .addTag('auth') // Add a tag for categorizing endpoints in Swagger UI
//  .build();

import { SwaggerConfig } from './swagger.interface';

export const SWAGGER_CONFIG: SwaggerConfig = {
  title: 'Nest JS 2025',
  description: 'api specs',
  version: '1.0',
  tags: [],
};

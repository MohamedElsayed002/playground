import './instrument'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';
import helmet from 'helmet'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: true,
      prefix: 'Playground',
      json: true,
      timestamp:true
    })
  });

  const config = new DocumentBuilder()
    .setTitle("Playground | My Arsenal")
    .setDescription(':P')
    .setVersion('1.0')
    .build();
  const document = () => SwaggerModule.createDocument(app,config)
  SwaggerModule.setup('api',app,document)
  app.enableCors();
  app.use(helmet())


  await app.listen(3001);
}
bootstrap();

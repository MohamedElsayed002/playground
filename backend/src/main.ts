import './instrument'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';
import helmet from 'helmet'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

let appInstance: any

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: true,
      prefix: 'Playground',
      json: true,
      timestamp: true
    })
  });

  const config = new DocumentBuilder()
    .setTitle("Playground | My Arsenal")
    .setDescription(':P')
    .setVersion('1.0')
    .build();
  const document = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.enableCors();
  app.use(helmet())

  await app.init()
  appInstance = app
  return app
}

if (require.main === module) {
  bootstrap().then(app => {
    app.listen(3000)
  })
}
export { bootstrap, appInstance }
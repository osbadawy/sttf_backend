// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import 'dotenv/config';
import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

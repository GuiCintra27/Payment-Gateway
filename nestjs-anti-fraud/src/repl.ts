import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
void bootstrap();

//repl - read-eval-print loop

// python

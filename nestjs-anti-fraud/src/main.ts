import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfluentKafkaServer } from './kafka/confluent-kafka-server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    strategy: new ConfluentKafkaServer({
      server: {
        'bootstrap.servers': process.env.KAFKA_BROKER || 'localhost:9092',
      },
      consumer: {
        allowAutoTopicCreation: true,
        sessionTimeout: 10000,
        rebalanceTimeout: 10000,
      },
    }),
  });
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

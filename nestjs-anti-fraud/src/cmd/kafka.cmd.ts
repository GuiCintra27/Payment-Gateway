import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfluentKafkaServer } from '../kafka/confluent-kafka-server';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
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
  console.log('Kafka microservice is running');
  await app.listen();
}
bootstrap();

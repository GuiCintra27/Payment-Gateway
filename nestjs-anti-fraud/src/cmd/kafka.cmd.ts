import { NestFactory } from '@nestjs/core';
import { ConfluentKafkaServer } from '../kafka/confluent-kafka-server';
import { WorkerModule } from '../worker/worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
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
  const port = process.env.ANTIFRAUD_WORKER_PORT || 3101;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Kafka worker running with metrics on port ${port}`);
}
bootstrap();

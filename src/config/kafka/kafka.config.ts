import * as dotenv from 'dotenv';
import { KafkaOptions, Transport } from '@nestjs/microservices';

const ENV_FILE = `.env`;

dotenv.config({ path: ENV_FILE });

export const kafkaOptionsFactory = (): KafkaOptions => {
  const options: KafkaOptions['options'] = {
    client: {
      clientId: process.env.KAFKA_CLIENT_ID || 'transaction',
      brokers: (process.env.KAFKA_CLIENT_BROKERS || 'localhost:29092').split(','),
    },
    consumer: {
      groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'transaction-consumer',
    },
    subscribe: {
      fromBeginning: true,
    },
  };

  return { transport: Transport.KAFKA, options };
};
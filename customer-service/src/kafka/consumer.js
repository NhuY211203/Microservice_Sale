const { Kafka } = require('kafkajs');

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'customer-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'customer-service-group' });

// Subscribe to Kafka topics
const subscribeToKafka = async () => {
  try {
    await consumer.connect();
    console.log('Connected to Kafka consumer');
    
    // Subscribe to order-created topic
    await consumer.subscribe({ topic: 'order-created', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`Message received from topic ${topic}:`, data);
          
          // Process the message based on topic
          switch (topic) {
            case 'order-created':
              console.log(`Customer ${data.customerId} placed new order ${data.orderId}`);
              break;
            default:
              console.log(`No handler for topic ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing message from topic ${topic}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Failed to connect to Kafka consumer:', error);
  }
};

module.exports = { subscribeToKafka };
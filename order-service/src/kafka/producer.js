const { Kafka } = require('kafkajs');

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const producer = kafka.producer();

// Connect to Kafka on service startup
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Connected to Kafka producer');
  } catch (error) {
    console.error('Failed to connect to Kafka producer:', error);
  }
};

// Send message to Kafka topic
const produceMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`Message sent to topic ${topic}`);
  } catch (error) {
    console.error(`Error sending message to topic ${topic}:`, error);
  }
};

// Connect producer when the module is imported
connectProducer();

module.exports = { produceMessage };
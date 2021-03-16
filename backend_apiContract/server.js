require("dotenv").config({ path: "./.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./configure/db.js");
const app = express();

const PORT = 3000;

const kafka = require("kafka-node");
const defaultTopicName = "aws-kafka";
const kafkaHost = process.env.KAFKA_URL;

const client = new kafka.KafkaClient({
  kafkaHost: kafkaHost,
  idleConnection: 24 * 60 * 60 * 1000
});

const topics = [
  {
    topic: defaultTopicName,
    partitions: 1,
    replicationFactor: 1,
  },
];

client.createTopics(topics, (err, result) => {
  // console.log()
});

const producer = new kafka.HighLevelProducer(client);
// const consumer = new kafka.Consumer(client, [{ topic: defaultTopicName }], {
//   groupId: 'node-express-kafka-group'
// });

producer.on("ready", function () {
  console.log("Kafka Producer is connected and ready.");
  app.use(function (req, res, next) {
    req.producer = producer;
    req.client = client;
    req.defaultTopicName = defaultTopicName;
    next();
  });

  app.use(cors());

  app.get("/", (req, res) => {
    res.status(200).json({ message: "API is running" });
  });

  // DataBase Connection
  connectDB();

  app.use(express.json());

  // Cheking for bad request
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).send({ message: "Invalid request body" }); // Bad request
    }
    next();
  });

  // Routes
  const taskRouter = require("./routes/task");
  app.use("/api/task", taskRouter);

  const tasksRouter = require("./routes/tasks");
  app.use("/api/tasks", tasksRouter);
});

producer.on("error", function (error) {
  console.log("Error", error);
});

// API server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// module.exports = app;

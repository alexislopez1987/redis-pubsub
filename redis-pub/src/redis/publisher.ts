import Redis from "ioredis";
import redisconfig from "../config/redisconfig";

const redis = new Redis(redisconfig.REDIS_PORT, redisconfig.REDIS_HOST);

export const sendMessage = async (channel: string, message: object) => {
  try {
    console.log(`mensaje a enviar: ${JSON.stringify(message, null, 2)}`);
    const publishMsg = await redis.publish(channel, JSON.stringify(message));
    console.log("mensaje publicado 👍", publishMsg);
  } catch (error) {
    console.error("💩 error al publicar", error);
  }
};

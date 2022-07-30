import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "express-async-errors";
import helmet from "helmet";
import responseTime from "response-time";
import Redis from "ioredis";
import config from "./config/redisconfig";
import { applyInventoryChannel } from "./config/channel";
import { StatusCodes } from "http-status-codes";

const app: Express = express();
const port = process.env.PORT ?? 8083;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(responseTime());

const redis = new Redis(config.REDIS_PORT, config.REDIS_HOST);

const main = async () => {
  try {
    await redis.subscribe(applyInventoryChannel);
    console.log(`🥳 Suscrito existosamente a ${applyInventoryChannel}!`);
  } catch (error) {
    console.error(`💩 fallo al suscribirse`, error);
  }

  /*
  redis.subscribe(applyInventoryChannel, (err, count) => {
    if (err) {
    } else {
      console.log(
        `🥳 Suscrito existosamente a ${applyInventoryChannel}! Este cliente esta suscrito a ${count} canales`
      );
    }
  });
   */

  redis.on("message", (channel, message) => {
    console.log(`📞 mensaje recibido desde ${channel}`);
    console.log(JSON.parse(message));
  });
};

main();

app.get("/connect", async (req: Request, res: Response) => {
  try {
    await main();
    res
      .json({
        message: `📞 conectado a canal ${applyInventoryChannel}`,
      })
      .status(StatusCodes.OK);
  } catch (error) {
    console.error("💩 error al suscribirse...", error);
    res
      .send({
        error: `💩 hubo un error al suscribirse a canal ${applyInventoryChannel}`,
      })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
});

app.get("/disconnect", (req: Request, res: Response) => {
  redis.unsubscribe(applyInventoryChannel, (error, result) => {
    if (error) {
      console.error("💩 error al desuscribirse...", result);
      res
        .send({
          error: `💩 hubo un error al desuscribirse a canal ${applyInventoryChannel}`,
        })
        .status(StatusCodes.INTERNAL_SERVER_ERROR);
    } else {
      res.json({
        message: `💀 se desconecto de canal ${applyInventoryChannel}`,
      });
    }
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "nodejs + redis suscriptor 🦻" });
});

app.all("*", async (req: Request, res: Response) => {
  res.send({ error: `☠️ url no existe` }).status(StatusCodes.NOT_FOUND);
});

app.listen(port, () => {
  console.log(`servidor nodejs redis subscriptor 👂 en puerto ${port}`);
});

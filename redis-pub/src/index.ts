import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import "express-async-errors";
import helmet from "helmet";
import responseTime from "response-time";
import { StatusCodes } from "http-status-codes";
import { sendMessage } from "./redis/publisher";
import { applyInventoryChannel } from "./config/channel";

const app: Express = express();
const port = process.env.PORT ?? 8082;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(responseTime());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "nodejs + redis publicador ✍️" });
});

app.post("/publish", async (req: Request, res: Response) => {
  if (!req.body.idInventory) {
    res
      .json({ error: `debe enviar id inventario` })
      .status(StatusCodes.BAD_REQUEST);
  }

  const isNotNumber = Number.isNaN(req.body.idInventory);

  if (isNotNumber) {
    res
      .json({ error: `id inventario debe ser un numero` })
      .status(StatusCodes.BAD_REQUEST);
  }

  const idInventory = parseInt(req.body.idInventory, 10);

  if (idInventory < 0) {
    res
      .json({ error: `id inventario debe ser numero positivo` })
      .status(StatusCodes.BAD_REQUEST);
  }

  try {
    await sendMessage(applyInventoryChannel, {
      inventoryToApply: idInventory,
      user: req.body.user ?? "",
      date: new Date().toLocaleString(),
    });

    res
      .json({
        message: `inventario ${idInventory} sera aplicado, le avisaremos cuando termine 🙂`,
      })
      .status(StatusCodes.ACCEPTED);
  } catch (error) {
    console.error(error);
    res
      .send({ error: `hubo un error 💩` })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
});

app.all("*", async (req: Request, res: Response) => {
  res.send({ error: `🤕 url no existe` }).status(StatusCodes.NOT_FOUND);
});

app.listen(port, () => {
  console.log(`servidor nodejs redis publicador 👂 en puerto ${port}`);
});

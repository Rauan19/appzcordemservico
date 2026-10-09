import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRoles } from "../../http/auth.ts";
import { WhatsappService } from "./whatsapp.service.ts";

const nameParams = z.object({ name: z.string() });
const createBody = z.object({ name: z.string().trim() });

export async function whatsappRoutes(app: FastifyInstance) {
  const service = new WhatsappService();
  app.addHook("onRequest", requireRoles("ADMIN"));

  app.get("/instances", async () => service.list());

  app.post("/instances", async (req, reply) => {
    const { name } = createBody.parse(req.body);
    return reply.status(201).send(await service.create(name));
  });

  app.get("/instances/:name/qrcode", async (req) => service.connect(nameParams.parse(req.params).name));

  app.get("/instances/:name/state", async (req) => service.state(nameParams.parse(req.params).name));

  app.post("/instances/:name/disconnect", async (req) => {
    await service.disconnect(nameParams.parse(req.params).name);
    return { ok: true };
  });

  app.delete("/instances/:name", async (req) => {
    await service.remove(nameParams.parse(req.params).name);
    return { ok: true };
  });
}

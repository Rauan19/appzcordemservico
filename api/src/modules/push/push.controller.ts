import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import {
  RegisterDeviceTokenSchema,
  SendManualPushSchema,
  UnregisterDeviceTokenSchema,
} from "./push.schemas.ts";
import { PushNotificationService } from "./push.service.ts";

export class PushController {
  constructor(private readonly service = new PushNotificationService()) {}

  register = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterDeviceTokenSchema.parse(req.body);
    const user = req.user as JwtUser;
    await this.service.registerToken(user.sub, body.token, body.platform);
    return reply.status(204).send();
  };

  unregister = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = UnregisterDeviceTokenSchema.parse(req.body);
    const user = req.user as JwtUser;
    await this.service.unregisterToken(user.sub, body.token);
    return reply.status(204).send();
  };

  adminOverview = async (_req: FastifyRequest, reply: FastifyReply) => {
    const overview = await this.service.getAdminOverview();
    return reply.send(overview);
  };

  sendManual = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = SendManualPushSchema.parse(req.body);
    const result = await this.service.sendManualPush(body);
    return reply.send(result);
  };
}

import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtUser } from "../../http/auth.ts";
import { RegisterDeviceTokenSchema, UnregisterDeviceTokenSchema } from "./push.schemas.ts";
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
}

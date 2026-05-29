import { BadRequestError, NotFoundError } from "../../http/http-errors.ts";
import { UserRepository } from "./user.repository.ts";

export class UserService {
  constructor(private readonly repo = new UserRepository()) {}

  async listTechnicians() {
    return this.repo.list({ role: "TECHNICIAN", active: true });
  }

  async listAll() {
    return this.repo.list();
  }

  async setActive(requesterId: string, userId: string, active: boolean) {
    if (requesterId === userId && !active) {
      throw new BadRequestError("Você não pode inativar sua própria conta");
    }

    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    if (!active && user.role === "ADMIN") {
      const activeAdmins = await this.repo.countActiveByRole("ADMIN");
      if (activeAdmins <= 1) {
        throw new BadRequestError("Não é possível inativar o último administrador");
      }
    }

    return this.repo.setActive(userId, active);
  }
}

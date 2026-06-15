import bcrypt from "bcryptjs";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../http/http-errors.ts";
import { AuthRepository } from "./auth.repository.ts";

export class AuthService {
  constructor(private readonly repo = new AuthRepository()) {}

  async login(email: string, password: string) {
    const user = await this.repo.findByEmail(email);
    if (!user || !user.active) {
      throw new UnauthorizedError("E-mail ou senha incorretos");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedError("E-mail ou senha incorretos");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async me(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user || !user.active) throw new NotFoundError("Usuário não encontrado");
    return user;
  }

  async updateMyLocation(userId: string, latitude: number, longitude: number) {
    const user = await this.repo.findById(userId);
    if (!user || !user.active) throw new NotFoundError("Usuário não encontrado");
    return this.repo.updateLocation(userId, latitude, longitude);
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN";
  }) {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw new ConflictError("E-mail já cadastrado");

    const hash = await bcrypt.hash(input.password, 10);
    return this.repo.create({ ...input, password: hash });
  }
}

import { NotFoundError } from "../../http/http-errors.ts";
import { ServiceCatalogRepository } from "./service-catalog.repository.ts";

export class ServiceCatalogService {
  constructor(private readonly repo = new ServiceCatalogRepository()) {}

  async create(input: { name: string; description?: string; active?: boolean }) {
    return this.repo.create(input);
  }

  async list(activeOnly?: boolean) {
    return this.repo.list(activeOnly);
  }

  async getById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError("Serviço não encontrado");
    return item;
  }

  async update(id: string, input: { name?: string; description?: string; active?: boolean }) {
    await this.getById(id);
    return this.repo.update(id, input);
  }
}

import { NotFoundError } from "../../http/http-errors.ts";
import { ContractTemplateRepository } from "./contract-template.repository.ts";

export class ContractTemplateService {
  constructor(private readonly repo = new ContractTemplateRepository()) {}

  list(activeOnly = false) {
    return this.repo.list(activeOnly);
  }

  async getById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundError("Modelo de contrato não encontrado");
    return item;
  }

  create(input: {
    name: string;
    content: string;
    active?: boolean;
    createdById?: string;
  }) {
    return this.repo.create(input);
  }

  async update(
    id: string,
    input: { name?: string; content?: string; active?: boolean },
  ) {
    await this.getById(id);
    return this.repo.update(id, input);
  }
}

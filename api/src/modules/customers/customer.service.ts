import { ConflictError, NotFoundError } from "../../http/http-errors.ts";
import { CustomerRepository } from "./customer.repository.ts";

export class CustomerService {
  constructor(private readonly repo = new CustomerRepository()) {}

  async create(input: {
    fullName: string;
    cpf: string;
    phone: string;
    email?: string;
  }) {
    const existing = await this.repo.findByCpf(input.cpf);
    if (existing) throw new ConflictError("CPF já cadastrado");
    return this.repo.create(input);
  }

  async getById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundError("Cliente não encontrado");
    return customer;
  }

  async list() {
    return this.repo.list();
  }
}


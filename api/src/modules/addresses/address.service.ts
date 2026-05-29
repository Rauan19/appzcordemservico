import { NotFoundError } from "../../http/http-errors.ts";
import { CustomerRepository } from "../customers/customer.repository.ts";
import { AddressRepository } from "./address.repository.ts";

export class AddressService {
  constructor(
    private readonly repo = new AddressRepository(),
    private readonly customers = new CustomerRepository(),
  ) {}

  async create(
    customerId: string,
    input: {
      label?: string;
      street?: string;
      number?: string;
      district?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      complement?: string;
      reference?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const customer = await this.customers.findById(customerId);
    if (!customer) throw new NotFoundError("Cliente não encontrado");
    return this.repo.create(customerId, input);
  }

  async list(customerId: string) {
    const customer = await this.customers.findById(customerId);
    if (!customer) throw new NotFoundError("Cliente não encontrado");
    return this.repo.listByCustomer(customerId);
  }

  async getById(customerId: string, id: string) {
    const address = await this.repo.findById(id, customerId);
    if (!address) throw new NotFoundError("Endereço não encontrado");
    return address;
  }
}

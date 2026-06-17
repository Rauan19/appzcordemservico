import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@zcnet.local" },
    create: {
      name: "Administrador",
      email: "admin@zcnet.local",
      password,
      role: "ADMIN",
    },
    update: {
      name: "Administrador",
      password,
      role: "ADMIN",
      active: true,
    },
  });

  const techPassword = await bcrypt.hash("tecnico123", 10);
  const tech = await prisma.user.upsert({
    where: { email: "tecnico@zcnet.local" },
    create: {
      name: "Técnico Demo",
      email: "tecnico@zcnet.local",
      password: techPassword,
      role: "TECHNICIAN",
    },
    update: {
      name: "Técnico Demo",
      password: techPassword,
      role: "TECHNICIAN",
      active: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { cpf: "00000000000" },
    create: {
      fullName: "Cliente Demo",
      cpf: "00000000000",
      phone: "(11) 99999-0000",
    },
    update: {
      fullName: "Cliente Demo",
      phone: "(11) 99999-0000",
    },
  });

  const address = await prisma.address.upsert({
    where: { id: "seed-address-demo" },
    create: {
      id: "seed-address-demo",
      customerId: customer.id,
      street: "Rua Exemplo",
      number: "100",
      district: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
    },
    update: {
      street: "Rua Exemplo",
      number: "100",
      district: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
    },
  });

  await prisma.product.upsert({
    where: { sku: "CABO-UTP" },
    create: {
      sku: "CABO-UTP",
      name: "Cabo de rede UTP",
      unit: "m",
      active: true,
    },
    update: { name: "Cabo de rede UTP", active: true },
  });

  await prisma.product.upsert({
    where: { sku: "CON-RJ45" },
    create: {
      sku: "CON-RJ45",
      name: "Conector RJ45",
      unit: "un",
      active: true,
    },
    update: { name: "Conector RJ45", active: true },
  });

  const order1 = await prisma.serviceOrder.upsert({
    where: { code: "OS-DEMO-001" },
    create: {
      code: "OS-DEMO-001",
      status: "ASSIGNED",
      priority: "NORMAL",
      customerId: customer.id,
      addressId: address.id,
      assignedToId: tech.id,
      title: "Instalação de rede  demo",
      description: "OS de exemplo para o técnico testar no app.",
    },
    update: {
      status: "ASSIGNED",
      assignedToId: tech.id,
      title: "Instalação de rede  demo",
      description: "OS de exemplo para o técnico testar no app.",
    },
  });

  await prisma.serviceOrderTechnician.upsert({
    where: {
      serviceOrderId_userId: { serviceOrderId: order1.id, userId: tech.id },
    },
    create: { serviceOrderId: order1.id, userId: tech.id },
    update: {},
  });

  const order2 = await prisma.serviceOrder.upsert({
    where: { code: "OS-DEMO-002" },
    create: {
      code: "OS-DEMO-002",
      status: "OPEN",
      priority: "HIGH",
      customerId: customer.id,
      addressId: address.id,
      assignedToId: tech.id,
      title: "Manutenção preventiva  demo",
      description: "OS aberta atribuída ao técnico (pode iniciar direto).",
    },
    update: {
      assignedToId: tech.id,
      title: "Manutenção preventiva  demo",
      description: "OS aberta atribuída ao técnico (pode iniciar direto).",
    },
  });

  await prisma.serviceOrderTechnician.upsert({
    where: {
      serviceOrderId_userId: { serviceOrderId: order2.id, userId: tech.id },
    },
    create: { serviceOrderId: order2.id, userId: tech.id },
    update: {},
  });

  const orderDone = await prisma.serviceOrder.upsert({
    where: { code: "OS-DEMO-DONE" },
    create: {
      code: "OS-DEMO-DONE",
      status: "DONE",
      priority: "NORMAL",
      customerId: customer.id,
      addressId: address.id,
      assignedToId: tech.id,
      title: "Suporte concluído  demo",
      description: "OS finalizada para testar avaliações no painel.",
      finishedAt: new Date(),
    },
    update: {
      status: "DONE",
      assignedToId: tech.id,
      finishedAt: new Date(),
    },
  });

  await prisma.serviceOrderTechnician.upsert({
    where: {
      serviceOrderId_userId: { serviceOrderId: orderDone.id, userId: tech.id },
    },
    create: { serviceOrderId: orderDone.id, userId: tech.id },
    update: {},
  });

  await prisma.serviceOrderEvaluation.upsert({
    where: { serviceOrderId: orderDone.id },
    create: {
      serviceOrderId: orderDone.id,
      technicianId: tech.id,
      rating: 5,
      comment: "Cliente elogiou a agilidade do técnico.",
      createdById: admin.id,
    },
    update: {
      rating: 5,
      comment: "Cliente elogiou a agilidade do técnico.",
    },
  });

  const ordersWithTechnician = await prisma.serviceOrder.findMany({
    where: { assignedToId: { not: null } },
    select: { id: true, assignedToId: true },
  });

  for (const order of ordersWithTechnician) {
    if (!order.assignedToId) continue;
    await prisma.serviceOrderTechnician.upsert({
      where: {
        serviceOrderId_userId: {
          serviceOrderId: order.id,
          userId: order.assignedToId,
        },
      },
      create: { serviceOrderId: order.id, userId: order.assignedToId },
      update: {},
    });
  }

  const templateContent = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERNET

Pelo presente instrumento, {{nome}}, inscrito(a) no CPF {{cpf}}, telefone {{telefone}}, residente em {{endereco}}, contrata os serviços da ZC NET CONFIG.

Plano contratado: {{plano}}
Valor mensal: R$ {{valor}}

Data: {{data}}

Ao assinar digitalmente, o contratante declara estar de acordo com os termos acima.`;

  await prisma.contractTemplate.upsert({
    where: { id: "seed-contract-template" },
    create: {
      id: "seed-contract-template",
      name: "Contrato Internet Residencial",
      content: templateContent,
      createdById: admin.id,
    },
    update: {
      name: "Contrato Internet Residencial",
      content: templateContent,
      active: true,
    },
  });

  console.log("Seed OK:");
  console.log("  admin@zcnet.local / admin123");
  console.log("  tecnico@zcnet.local / tecnico123");
  console.log("  OS-DEMO-001 (Atribuída), OS-DEMO-002 (Aberta), OS-DEMO-DONE (avaliação demo)");
  console.log("  Modelo de contrato demo criado");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

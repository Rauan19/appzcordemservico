export const serviceOrderAssigneeInclude = {
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

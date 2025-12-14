import { prisma } from "@/lib/db"

export type AuditEvent = {
  actorUserId?: string | null
  action: string
  entityType: string
  entityId: string
  details?: any
}

export async function auditLog(evt: AuditEvent) {
  // nunca quebrar fluxo principal por falha de auditoria
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: evt.actorUserId ?? null,
        action: evt.action,
        entityType: evt.entityType,
        entityId: evt.entityId,
        details: evt.details ?? undefined,
      },
    })
  } catch {
    // noop
  }
}



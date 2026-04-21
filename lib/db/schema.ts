import { z } from "zod";

export const AgentStatusSchema = z.enum(["active", "paused", "error"]);

export const AgentSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email(),
  name: z.string().min(2).max(64),
  description: z.string().min(20).max(320),
  model: z.string().min(2).max(80),
  status: AgentStatusSchema,
  messageCount: z.number().int().nonnegative(),
  successRate: z.number().min(0).max(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSeenAt: z.string().nullable()
});

export const AgentCreateSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().min(20).max(320),
  model: z.string().min(2).max(80)
});

export const MemoryRecordSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email(),
  agentId: z.string(),
  namespace: z.string().min(1).max(64),
  key: z.string().min(1).max(120),
  value: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const MemoryWriteSchema = z.object({
  agentId: z.string().min(1),
  namespace: z.string().min(1).max(64).default("default"),
  key: z.string().min(1).max(120),
  value: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const TaskStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const TaskRecordSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email(),
  agentId: z.string(),
  type: z.string().min(1).max(80),
  payload: z.record(z.string(), z.unknown()),
  status: TaskStatusSchema,
  priority: z.number().int().min(1).max(5),
  attempts: z.number().int().nonnegative(),
  maxAttempts: z.number().int().min(1).max(10),
  result: z.unknown().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable()
});

export const TaskCreateSchema = z.object({
  agentId: z.string().min(1),
  type: z.string().min(1).max(80),
  payload: z.record(z.string(), z.unknown()),
  priority: z.number().int().min(1).max(5).default(3),
  maxAttempts: z.number().int().min(1).max(10).default(3)
});

export const TaskUpdateSchema = z.object({
  taskId: z.string().min(1),
  status: TaskStatusSchema,
  error: z.string().optional(),
  result: z.unknown().optional()
});

export const StateRecordSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email(),
  agentId: z.string(),
  key: z.string().min(1).max(120),
  value: z.unknown(),
  version: z.number().int().min(1),
  updatedAt: z.string()
});

export const StateUpsertSchema = z.object({
  agentId: z.string().min(1),
  key: z.string().min(1).max(120),
  value: z.unknown()
});

export const CommunicationRecordSchema = z.object({
  id: z.string(),
  ownerEmail: z.string().email(),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  channel: z.string().min(1).max(80),
  message: z.string().min(1).max(4000),
  status: z.enum(["queued", "delivered"]),
  createdAt: z.string(),
  deliveredAt: z.string().nullable()
});

export const CommunicationCreateSchema = z.object({
  fromAgentId: z.string().min(1),
  toAgentId: z.string().min(1),
  channel: z.string().min(1).max(80).default("coordination"),
  message: z.string().min(1).max(4000)
});

export const PurchaseRecordSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  source: z.enum(["stripe", "lemonsqueezy"]),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  createdAt: z.string()
});

export const AccessUnlockSchema = z.object({
  email: z.string().email()
});

export function parseCollection<T>(raw: unknown[], schema: z.ZodType<T>): T[] {
  const records: T[] = [];

  for (const entry of raw) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) {
      records.push(parsed.data);
    }
  }

  return records;
}

export type Agent = z.infer<typeof AgentSchema>;
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
export type TaskRecord = z.infer<typeof TaskRecordSchema>;
export type StateRecord = z.infer<typeof StateRecordSchema>;
export type CommunicationRecord = z.infer<typeof CommunicationRecordSchema>;
export type PurchaseRecord = z.infer<typeof PurchaseRecordSchema>;

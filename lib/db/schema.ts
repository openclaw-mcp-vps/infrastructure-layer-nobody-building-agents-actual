import { z } from "zod";

export const agentStatusSchema = z.enum(["healthy", "degraded", "offline"]);

export const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(180),
  status: agentStatusSchema,
  requests24h: z.number().int().nonnegative(),
  errorRate: z.number().min(0).max(1),
  avgLatencyMs: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createAgentInputSchema = z.object({
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(180)
});

export const memoryRecordSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  namespace: z.string().min(1).max(80),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(40)).max(10),
  createdAt: z.string().datetime()
});

export const createMemoryInputSchema = z.object({
  agentId: z.string().min(1),
  namespace: z.string().min(1).max(80),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(40)).max(10).default([])
});

export const taskStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const taskSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  title: z.string().min(2).max(180),
  payload: z.record(z.unknown()),
  priority: z.enum(["low", "normal", "high"]),
  status: taskStatusSchema,
  attempts: z.number().int().nonnegative(),
  runAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createTaskInputSchema = z.object({
  agentId: z.string().min(1),
  title: z.string().min(2).max(180),
  payload: z.record(z.unknown()).default({}),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  runAt: z.string().datetime().optional()
});

export const updateTaskStatusInputSchema = z.object({
  id: z.string().min(1),
  status: taskStatusSchema,
  attempts: z.number().int().nonnegative().optional()
});

export const stateRecordSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  key: z.string().min(1).max(120),
  value: z.record(z.unknown()),
  updatedAt: z.string().datetime()
});

export const upsertStateInputSchema = z.object({
  agentId: z.string().min(1),
  key: z.string().min(1).max(120),
  value: z.record(z.unknown())
});

export const messageStatusSchema = z.enum(["sent", "acknowledged"]);

export const messageSchema = z.object({
  id: z.string().min(1),
  fromAgentId: z.string().min(1),
  toAgentId: z.string().min(1),
  topic: z.string().min(2).max(140),
  payload: z.record(z.unknown()),
  status: messageStatusSchema,
  createdAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional()
});

export const createMessageInputSchema = z.object({
  fromAgentId: z.string().min(1),
  toAgentId: z.string().min(1),
  topic: z.string().min(2).max(140),
  payload: z.record(z.unknown()).default({})
});

export const acknowledgeMessageInputSchema = z.object({
  id: z.string().min(1)
});

export const purchaseRecordSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  email: z.string().email().optional(),
  createdAt: z.string().datetime()
});

export const dbSchema = z.object({
  agents: z.array(agentSchema),
  memories: z.array(memoryRecordSchema),
  tasks: z.array(taskSchema),
  state: z.array(stateRecordSchema),
  messages: z.array(messageSchema),
  purchases: z.array(purchaseRecordSchema)
});

export type AgentRecord = z.infer<typeof agentSchema>;
export type CreateAgentInput = z.infer<typeof createAgentInputSchema>;
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
export type CreateMemoryInput = z.infer<typeof createMemoryInputSchema>;
export type TaskRecord = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>;
export type StateRecord = z.infer<typeof stateRecordSchema>;
export type UpsertStateInput = z.infer<typeof upsertStateInputSchema>;
export type MessageRecord = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type AcknowledgeMessageInput = z.infer<typeof acknowledgeMessageInputSchema>;
export type PurchaseRecord = z.infer<typeof purchaseRecordSchema>;
export type DatabaseShape = z.infer<typeof dbSchema>;

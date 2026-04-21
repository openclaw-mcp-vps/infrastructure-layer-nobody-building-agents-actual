import {
  AgentSchema,
  CommunicationCreateSchema,
  CommunicationRecordSchema,
  MemoryRecordSchema,
  MemoryWriteSchema,
  StateRecordSchema,
  StateUpsertSchema,
  TaskCreateSchema,
  TaskRecordSchema
} from "@/lib/db/schema";

type SDKOptions = {
  baseUrl?: string;
};

async function parseResponse<T>(response: Response, parser: (value: unknown) => T): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Request failed";
    throw new Error(message);
  }

  return parser(payload);
}

export class AgentInfraSDK {
  private readonly baseUrl: string;

  constructor(options: SDKOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
  }

  async listAgents() {
    const response = await fetch(`${this.baseUrl}/api/agents`, { method: "GET", credentials: "include" });
    return parseResponse(response, (value) => {
      const list = (value as { agents: unknown[] }).agents;
      return list.map((item) => AgentSchema.parse(item));
    });
  }

  async createAgent(input: { name: string; description: string; model: string }) {
    const body = { ...input };
    const response = await fetch(`${this.baseUrl}/api/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    return parseResponse(response, (value) => AgentSchema.parse((value as { agent: unknown }).agent));
  }

  async writeMemory(input: {
    agentId: string;
    namespace?: string;
    key: string;
    value: unknown;
    metadata?: Record<string, unknown>;
  }) {
    const body = MemoryWriteSchema.parse(input);
    const response = await fetch(`${this.baseUrl}/api/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    return parseResponse(response, (value) => MemoryRecordSchema.parse((value as { memory: unknown }).memory));
  }

  async queueTask(input: {
    agentId: string;
    type: string;
    payload: Record<string, unknown>;
    priority?: number;
    maxAttempts?: number;
  }) {
    const body = TaskCreateSchema.parse(input);
    const response = await fetch(`${this.baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    return parseResponse(response, (value) => TaskRecordSchema.parse((value as { task: unknown }).task));
  }

  async upsertState(input: { agentId: string; key: string; value: unknown }) {
    const body = StateUpsertSchema.parse(input);
    const response = await fetch(`${this.baseUrl}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    return parseResponse(response, (value) => StateRecordSchema.parse((value as { state: unknown }).state));
  }

  async sendMessage(input: {
    fromAgentId: string;
    toAgentId: string;
    channel?: string;
    message: string;
  }) {
    const body = CommunicationCreateSchema.parse(input);
    const response = await fetch(`${this.baseUrl}/api/communication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    return parseResponse(response, (value) =>
      CommunicationRecordSchema.parse((value as { communication: unknown }).communication)
    );
  }
}

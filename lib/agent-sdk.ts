import { z } from "zod";

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.string(),
  requests24h: z.number(),
  errorRate: z.number(),
  avgLatencyMs: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const memorySchema = z.object({
  id: z.string(),
  agentId: z.string(),
  namespace: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string()
});

const taskSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  title: z.string(),
  payload: z.record(z.unknown()),
  priority: z.enum(["low", "normal", "high"]),
  status: z.enum(["queued", "running", "completed", "failed"]),
  attempts: z.number(),
  runAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const messageSchema = z.object({
  id: z.string(),
  fromAgentId: z.string(),
  toAgentId: z.string(),
  topic: z.string(),
  payload: z.record(z.unknown()),
  status: z.enum(["sent", "acknowledged"]),
  createdAt: z.string(),
  acknowledgedAt: z.string().optional()
});

function buildUrl(baseUrl: string, path: string, params?: Record<string, string>) {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function withQuery(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const queryString = query.toString();
  return queryString.length > 0 ? `${path}?${queryString}` : path;
}

export class AgentInfrastructureSDK {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}

  private async request<T>(path: string, init?: RequestInit, schema?: z.ZodSchema<T>) {
    const response = await fetch(buildUrl(this.baseUrl, path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(init?.headers ?? {})
      },
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`AgentInfra API request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!schema) {
      return payload;
    }

    return schema.parse(payload);
  }

  listAgents() {
    return this.request("/api/agents", undefined, z.array(agentSchema));
  }

  createAgent(input: { name: string; role: string }) {
    return this.request(
      "/api/agents",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      agentSchema
    );
  }

  listMemory(params?: { agentId?: string; query?: string }) {
    const qp: Record<string, string> = {};
    if (params?.agentId) {
      qp.agentId = params.agentId;
    }
    if (params?.query) {
      qp.query = params.query;
    }

    return this.request(withQuery("/api/memory", qp), undefined, z.array(memorySchema));
  }

  createMemory(input: { agentId: string; namespace: string; content: string; tags?: string[] }) {
    return this.request(
      "/api/memory",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      memorySchema
    );
  }

  listTasks(params?: { agentId?: string; status?: "queued" | "running" | "completed" | "failed" }) {
    const qp: Record<string, string> = {};
    if (params?.agentId) {
      qp.agentId = params.agentId;
    }
    if (params?.status) {
      qp.status = params.status;
    }

    return this.request(withQuery("/api/tasks", qp), undefined, z.array(taskSchema));
  }

  createTask(input: {
    agentId: string;
    title: string;
    payload?: Record<string, unknown>;
    priority?: "low" | "normal" | "high";
  }) {
    return this.request(
      "/api/tasks",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      taskSchema
    );
  }

  setState(input: { agentId: string; key: string; value: Record<string, unknown> }) {
    return this.request(
      "/api/state",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );
  }

  listMessages(params?: { agentId?: string }) {
    const qp: Record<string, string> = {};
    if (params?.agentId) {
      qp.agentId = params.agentId;
    }

    return this.request(withQuery("/api/messages", qp), undefined, z.array(messageSchema));
  }

  sendMessage(input: {
    fromAgentId: string;
    toAgentId: string;
    topic: string;
    payload?: Record<string, unknown>;
  }) {
    return this.request(
      "/api/messages",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      messageSchema
    );
  }
}

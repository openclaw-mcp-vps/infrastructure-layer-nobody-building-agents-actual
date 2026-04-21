import { NextResponse } from "next/server";
import { AgentCreateSchema, AgentSchema, parseCollection } from "@/lib/db/schema";
import { requirePaidAccess } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const AGENTS_FILE = "agents.json";

export async function GET() {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const raw = await readJsonFile<unknown[]>(AGENTS_FILE, []);
  const agents = parseCollection(raw, AgentSchema)
    .filter((agent) => agent.ownerEmail === auth.email)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = AgentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid agent payload." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const raw = await readJsonFile<unknown[]>(AGENTS_FILE, []);
  const currentAgents = parseCollection(raw, AgentSchema);

  const agent = AgentSchema.parse({
    id: crypto.randomUUID(),
    ownerEmail: auth.email,
    name: parsed.data.name,
    description: parsed.data.description,
    model: parsed.data.model,
    status: "active",
    messageCount: 0,
    successRate: 1,
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now
  });

  const next = [agent, ...currentAgents];
  await writeJsonFile(AGENTS_FILE, next);

  return NextResponse.json({ agent }, { status: 201 });
}

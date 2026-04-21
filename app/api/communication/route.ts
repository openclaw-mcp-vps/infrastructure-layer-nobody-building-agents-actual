import { NextResponse } from "next/server";
import {
  AgentSchema,
  CommunicationCreateSchema,
  CommunicationRecordSchema,
  parseCollection
} from "@/lib/db/schema";
import { requirePaidAccess } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const COMMUNICATION_FILE = "communication.json";
const AGENTS_FILE = "agents.json";

export async function GET(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  }

  const raw = await readJsonFile<unknown[]>(COMMUNICATION_FILE, []);
  const communication = parseCollection(raw, CommunicationRecordSchema)
    .filter(
      (record) =>
        record.ownerEmail === auth.email &&
        (record.fromAgentId === agentId || record.toAgentId === agentId)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ communication });
}

export async function POST(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = CommunicationCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid communication payload." }, { status: 400 });
  }

  const agentsRaw = await readJsonFile<unknown[]>(AGENTS_FILE, []);
  const agents = parseCollection(agentsRaw, AgentSchema);

  const ownsSourceAndTarget = [parsed.data.fromAgentId, parsed.data.toAgentId].every((id) =>
    agents.some((agent) => agent.id === id && agent.ownerEmail === auth.email)
  );

  if (!ownsSourceAndTarget) {
    return NextResponse.json({ error: "Both agents must exist in your workspace." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const raw = await readJsonFile<unknown[]>(COMMUNICATION_FILE, []);
  const current = parseCollection(raw, CommunicationRecordSchema);

  const communication = CommunicationRecordSchema.parse({
    id: crypto.randomUUID(),
    ownerEmail: auth.email,
    fromAgentId: parsed.data.fromAgentId,
    toAgentId: parsed.data.toAgentId,
    channel: parsed.data.channel,
    message: parsed.data.message,
    status: "delivered",
    createdAt: now,
    deliveredAt: now
  });

  await writeJsonFile(COMMUNICATION_FILE, [communication, ...current]);

  return NextResponse.json({ communication }, { status: 201 });
}

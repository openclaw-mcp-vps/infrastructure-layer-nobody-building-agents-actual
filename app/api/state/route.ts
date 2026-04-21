import { NextResponse } from "next/server";
import {
  AgentSchema,
  parseCollection,
  StateRecordSchema,
  StateUpsertSchema
} from "@/lib/db/schema";
import { requirePaidAccess } from "@/lib/auth";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const STATE_FILE = "state.json";
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

  const raw = await readJsonFile<unknown[]>(STATE_FILE, []);
  const state = parseCollection(raw, StateRecordSchema)
    .filter((record) => record.ownerEmail === auth.email && record.agentId === agentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ state });
}

export async function POST(req: Request) {
  const auth = await requirePaidAccess();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await req.json();
  const parsed = StateUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid state payload." }, { status: 400 });
  }

  const agentsRaw = await readJsonFile<unknown[]>(AGENTS_FILE, []);
  const agents = parseCollection(agentsRaw, AgentSchema);

  const ownsAgent = agents.some(
    (agent) => agent.id === parsed.data.agentId && agent.ownerEmail === auth.email
  );

  if (!ownsAgent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const raw = await readJsonFile<unknown[]>(STATE_FILE, []);
  const current = parseCollection(raw, StateRecordSchema);

  const idx = current.findIndex(
    (entry) =>
      entry.ownerEmail === auth.email &&
      entry.agentId === parsed.data.agentId &&
      entry.key === parsed.data.key
  );

  const stateRecord = StateRecordSchema.parse({
    id: idx >= 0 ? current[idx].id : crypto.randomUUID(),
    ownerEmail: auth.email,
    agentId: parsed.data.agentId,
    key: parsed.data.key,
    value: parsed.data.value,
    version: idx >= 0 ? current[idx].version + 1 : 1,
    updatedAt: now
  });

  if (idx >= 0) {
    current[idx] = stateRecord;
  } else {
    current.unshift(stateRecord);
  }

  await writeJsonFile(STATE_FILE, current);

  return NextResponse.json({ state: stateRecord }, { status: idx >= 0 ? 200 : 201 });
}

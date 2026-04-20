import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks, updateTaskStatus } from "@/lib/data-store";
import {
  createTaskInputSchema,
  updateTaskStatusInputSchema
} from "@/lib/db/schema";
import { requestHasPaidAccess, unauthorizedPaywallResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const tasks = await listTasks(agentId, status);
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  if (!requestHasPaidAccess(request)) {
    return unauthorizedPaywallResponse();
  }

  const json = await request.json();

  if (json?.action === "update_status") {
    const parsedUpdate = updateTaskStatusInputSchema.safeParse(json);

    if (!parsedUpdate.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsedUpdate.error.flatten() },
        { status: 400 }
      );
    }

    const task = await updateTaskStatus(parsedUpdate.data);

    if (!task) {
      return NextResponse.json(
        { error: "not_found", message: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  }

  const parsed = createTaskInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const task = await createTask(parsed.data);
  return NextResponse.json(task, { status: 201 });
}

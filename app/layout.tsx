import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentinfra.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "The Infrastructure Layer Nobody Is Building | AgentInfra",
  description:
    "AgentInfra provides persistent memory, queue orchestration, state machines, and cross-agent messaging APIs so engineering teams can run AI agents reliably in production.",
  keywords: [
    "AI agents",
    "agent infrastructure",
    "persistent memory",
    "task queue",
    "agent orchestration",
    "production AI"
  ],
  openGraph: {
    title: "The Infrastructure Layer Nobody Is Building: What Agents Actually Need to Scale",
    description:
      "Stop rebuilding plumbing. Ship production AI agents with memory, queueing, state, and inter-agent messaging APIs.",
    url: baseUrl,
    siteName: "AgentInfra",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentInfra: What Production Agents Actually Need",
    description:
      "Infrastructure APIs for persistent memory, task queues, state management, and cross-agent communication."
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

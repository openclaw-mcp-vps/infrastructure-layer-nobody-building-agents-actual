import type { Metadata } from "next";
import "./globals.css";

const siteTitle = "AgentInfra: The Infrastructure Layer Nobody Is Building";
const siteDescription =
  "Production infrastructure APIs for AI agents: persistent memory, task queues, state management, and cross-agent communication with observability built in.";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentinfra.example.com"),
  title: {
    default: siteTitle,
    template: "%s | AgentInfra"
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "https://agentinfra.example.com",
    siteName: "AgentInfra"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

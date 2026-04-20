import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { Pricing } from "@/components/landing/pricing";
import { getCheckoutUrl } from "@/lib/lemonsqueezy";

const faqs = [
  {
    question: "Who is this for?",
    answer:
      "Engineering teams building AI-first products who already proved user demand, but are spending too much time on memory, queues, retries, and orchestration plumbing."
  },
  {
    question: "What does the paid tier unlock?",
    answer:
      "The dashboard and API layer for managing agents, memory records, task queues, and runtime state. The platform is gated behind a paid cookie after checkout."
  },
  {
    question: "Can this replace custom infrastructure?",
    answer:
      "Yes for most early production workloads. AgentInfra gives you stable primitives so your team can ship differentiated agent logic rather than boilerplate ops code."
  },
  {
    question: "How quickly can we integrate?",
    answer:
      "Most teams can connect existing agents in a day by routing memory writes, task dispatch, and state transitions through the provided APIs and SDK client."
  }
];

export default function LandingPage() {
  const checkoutUrl = getCheckoutUrl();

  return (
    <main className="pb-16">
      <Hero checkoutUrl={checkoutUrl} />
      <ProblemSection />
      <SolutionSection />
      <Pricing checkoutUrl={checkoutUrl} />

      <section className="container py-12">
        <div className="panel p-6 sm:p-8">
          <h2 className="mb-6 text-3xl font-semibold text-white">FAQ</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-xl border border-[#243043] bg-[#0f172a]/65 p-5">
                <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Ready to stop rebuilding infrastructure?</h2>
            <p className="mt-1 text-sm text-gray-300">
              Unlock AgentInfra and move your team from prototype chaos to reliable production agents.
            </p>
          </div>
          <Link href="/dashboard" className="btn-primary">
            View product dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

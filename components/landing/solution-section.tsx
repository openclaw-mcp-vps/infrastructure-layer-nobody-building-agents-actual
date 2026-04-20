const solutionCards = [
  {
    title: "Persistent Memory API",
    body:
      "Store conversation context, execution traces, and customer-specific knowledge in namespaced memory records with retrieval and filtering built in."
  },
  {
    title: "Queue + Retry Engine",
    body:
      "Queue tasks with explicit priority, run scheduling, retries, and deterministic status transitions so every run is observable and recoverable."
  },
  {
    title: "State Store",
    body:
      "Persist finite-state snapshots and checkpoints per agent so orchestration can continue safely after deploys, crashes, or webhook spikes."
  },
  {
    title: "Inter-Agent Communication",
    body:
      "Pass structured payloads between specialized agents with clear boundaries, reducing hidden coupling and race conditions."
  }
];

export function SolutionSection() {
  return (
    <section className="container py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-green-300">What AgentInfra ships</p>
      <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
        Production-ready primitives so your agents can focus on logic, not plumbing
      </h2>
      <p className="mb-8 max-w-3xl text-gray-300">
        AgentInfra centralizes the operational layer every AI product team eventually builds: memory,
        queueing, state, and messaging. You get unified APIs, predictable behavior, and usable observability.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {solutionCards.map((card) => (
          <article key={card.title} className="panel p-5">
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-gray-300">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

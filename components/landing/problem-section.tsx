const painPoints = [
  {
    title: "State disappears between runs",
    detail:
      "Most agent stacks have no durable memory primitive, so teams bolt on ad hoc tables and brittle retrieval code."
  },
  {
    title: "Retries become production incidents",
    detail:
      "Without first-class queue semantics, one flaky dependency can cascade into replay storms and duplicated side effects."
  },
  {
    title: "No contract for agent handoffs",
    detail:
      "Cross-agent collaboration breaks down when every team invents its own payload schema, retries, and idempotency rules."
  }
];

export function ProblemSection() {
  return (
    <section className="container py-12">
      <div className="panel p-6 sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">Why teams stall</p>
        <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
          Prototype agents look impressive. Production agents break on basics.
        </h2>
        <p className="mb-8 max-w-3xl text-gray-300">
          Teams at 10-50 person startups are rebuilding infrastructure instead of shipping product value.
          The gap between demo success and operational reliability kills roadmap momentum.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {painPoints.map((point) => (
            <article key={point.title} className="rounded-xl border border-[#3a2f27] bg-[#1d1410]/60 p-5">
              <h3 className="text-lg font-semibold text-orange-100">{point.title}</h3>
              <p className="mt-2 text-sm text-orange-50/85">{point.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

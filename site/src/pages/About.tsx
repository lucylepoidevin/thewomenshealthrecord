export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose-step">
      <h1 className="display text-4xl font-medium">About</h1>
      <p className="mt-6 text-lg text-ink-2 leading-relaxed">
        The Women's Health Record is a Lucca Labs project. It exists because most of what is said about sex bias in
        medicine is repeated from a handful of well-worn statistics. We wanted the primary sources, re-analysed, and
        published with the code.
      </p>
      <p className="mt-4 text-ink-2 leading-relaxed">
        Nothing here is medical advice. If a chart makes you wonder about a drug you take, bring the chart to your
        doctor, not a conclusion.
      </p>
      <p className="mt-4 text-ink-2 leading-relaxed">
        New chapters are published alongside essays on the Lucca Labs Substack. Corrections and data questions are
        welcome through the GitHub repository linked in the footer.
      </p>
    </div>
  )
}

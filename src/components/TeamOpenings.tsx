export default function TeamOpenings() {
  return (
    <section aria-labelledby="team-openings-heading" className="max-w-6xl mx-auto px-6 pb-24">
      <div className="border-t border-gray-200 pt-12 md:pt-16">
        <h2 id="team-openings-heading" className="text-[32px] md:text-[40px] font-normal tracking-tight leading-tight mb-4">
          Join our team
        </h2>
        <p className="max-w-2xl text-base text-gray-600 leading-relaxed mb-6">
          Help frontier research reach the world. Explore opportunities across the Protocol Labs network.
        </p>
        <a
          href="https://os.pl.xyz/jobs"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-black underline decoration-gray-300 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
        >
          See open roles <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}

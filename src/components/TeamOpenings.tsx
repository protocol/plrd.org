export default function TeamOpenings() {
  return (
    <section aria-labelledby="team-openings-heading" className="max-w-6xl mx-auto px-6 pb-12">
      <div className="border-t border-gray-200 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div>
          <h2 id="team-openings-heading" className="text-[20px] font-normal tracking-tight leading-tight mb-1">
            Join our team
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Explore opportunities across the Protocol Labs network.
          </p>
        </div>
        <a
          href="https://os.pl.xyz/jobs"
          className="inline-flex self-start sm:self-auto shrink-0 min-h-11 items-center gap-2 rounded-sm text-sm font-medium text-black underline decoration-gray-300 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
        >
          See open roles <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}

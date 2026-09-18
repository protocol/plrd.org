// Curated openings. The linked Directory listings remain the application source of truth.
const openings = [
  {
    title: 'Philanthropic Fundraising Lead',
    description: 'Build and lead philanthropic fundraising for PL R&D. Turn frontier research programs into compelling cases for support, close funding commitments, and develop lasting relationships with science philanthropies, foundations, and major donors.',
    href: 'https://os.pl.xyz/jobs/openings/manual-pl-philanthropic-fundraising-lead?utm_source=job_refer_share&utm_medium=copy_link',
  },
  {
    title: 'Program Manager, Neurotech',
    description: 'Design and run programs that accelerate neurotechnology research. Work with scientists, founders, and funders on research grants, convenings, and talent programs, with safety and long-term human outcomes central to the work.',
    href: 'https://os.pl.xyz/jobs/openings/clneurotechpgm91537777x?utm_source=job_refer_share&utm_medium=copy_link',
  },
]

export default function TeamOpenings() {
  return (
    <section aria-labelledby="team-openings-heading" className="max-w-6xl mx-auto px-6 pb-24">
      <div className="border-t border-gray-200 pt-12 md:pt-16">
        <h2 id="team-openings-heading" className="text-[32px] md:text-[40px] font-normal tracking-tight leading-tight mb-4">
          Join our team
        </h2>
        <p className="max-w-2xl text-base text-gray-600 leading-relaxed mb-10">
          Help frontier research reach the world. We&apos;re hiring people to build the funding and programs that accelerate progress across PL R&amp;D.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {openings.map(role => (
            <article key={role.href} className="flex flex-col rounded-xl border border-gray-200 p-6 md:p-8">
              <h3 className="text-[24px] font-medium leading-tight tracking-tight mb-4">{role.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed mb-6">{role.description}</p>
              <a
                href={role.href}
                aria-label={`View role and apply: ${role.title}`}
                className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-sm font-medium text-black underline decoration-gray-300 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
              >
                View role and apply <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import CookieSettingsLink from './CookieSettingsLink'
import { COOKIE_CONSENT_ENABLED } from '@/lib/cookie-consent'
import { siteConfig } from '@/lib/site-config'

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* CTA banner */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center py-14 border-b border-white/10">
          <h2 className="text-[30px] md:text-[38px] font-serif font-normal leading-[1.1] max-w-[16ch]">
            Let&apos;s build the future of computing.
          </h2>
          <Link
            href="/outreach/collaboration/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-[14.5px] font-semibold rounded-full hover:bg-gray-200 transition-colors"
          >
            Collaborate
          </Link>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-7 py-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 font-semibold mb-3">
              <img src="/images/pl_logo_mark.svg" className="h-6 brightness-0 invert" alt="Protocol Labs" />
              <span>PL <span className="font-normal text-gray-400">R&amp;D</span></span>
            </div>
            <p className="text-[13.5px] text-[#9a9caa] leading-relaxed max-w-sm">
              PL R&amp;D is the research &amp; development initiative of Protocol Labs — building open
              infrastructure for human freedom, coordination, intelligence, and cognition.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[0.12em] text-[#8b8d99] font-bold mb-3.5">Explore</h5>
            <ul className="space-y-1.5 list-none m-0 p-0">
              <li><Link href="/about/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">About us</Link></li>
              <li><Link href="/insights/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Insights</Link></li>
              <li><Link href="/authors/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Team</Link></li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[0.12em] text-[#8b8d99] font-bold mb-3.5">Focus Areas</h5>
            <ul className="space-y-1.5 list-none m-0 p-0">
              <li><Link href="/areas/digital-human-rights/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Digital Human Rights</Link></li>
              <li><Link href="/areas/economies-governance/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Economies &amp; Governance</Link></li>
              <li><Link href="/areas/ai-robotics/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">AI &amp; Robotics</Link></li>
              <li><Link href="/areas/neurotech/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Neurotechnology</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[0.12em] text-[#8b8d99] font-bold mb-3.5">Connect</h5>
            <ul className="space-y-1.5 list-none m-0 p-0">
              <li><a href={siteConfig.githubUrl} className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">GitHub</a></li>
              <li><a href="https://bsky.app/profile/plrd.org" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Bluesky</a></li>
              <li><a href="https://x.com/protocollabs_rd" target="_blank" rel="noopener noreferrer" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">X / Twitter</a></li>
              <li><a href="/feed.xml" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">RSS</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[0.12em] text-[#8b8d99] font-bold mb-3.5">Legal</h5>
            <ul className="space-y-1.5 list-none m-0 p-0">
              <li><a href="https://www.protocol.ai/legal/#privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Privacy Policy</a></li>
              <li><a href="https://creativecommons.org/licenses/by/4.0/" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">CC-BY 4.0 License</a></li>
              <li><a href="mailto:research@protocol.ai" className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1">Contact</a></li>
              {process.env.NEXT_PUBLIC_GA_ID && COOKIE_CONSENT_ENABLED && (
                <li><CookieSettingsLink className="text-sm text-[#cfd1da] hover:text-white transition-colors block py-1 text-left" /></li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6 border-t border-white/10">
          <p className="text-[12.5px] text-[#8b8d99]">
            © Protocol Labs · Content licensed CC-BY 4.0 · A research initiative of Protocol Labs
          </p>
          <div className="flex gap-5 text-[13px]">
            <a href={siteConfig.githubUrl} className="text-[#cfd1da] hover:text-white transition-colors">GitHub</a>
            <a href="https://bsky.app/profile/plrd.org" className="text-[#cfd1da] hover:text-white transition-colors">Bluesky</a>
            <a href="https://x.com/protocollabs_rd" target="_blank" rel="noopener noreferrer" className="text-[#cfd1da] hover:text-white transition-colors">X</a>
            <a href="/feed.xml" className="text-[#cfd1da] hover:text-white transition-colors">RSS</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

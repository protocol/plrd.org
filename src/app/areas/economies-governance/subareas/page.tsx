import type { Metadata } from 'next'
import Breadcrumb from '@/components/Breadcrumb'
import MarkdownContent from '@/components/MarkdownContent'
import { fetchPage, getSection } from '@/lib/indexer'

export const metadata: Metadata = {
  title: 'Subareas',
  description: 'Nine interconnected subfields for economies and governance.',
}

type SubareaIconType = 'dpi' | 'desci' | 'depin' | 'pgf' | 'defi' | 'degov' | 'network-states' | 'nations' | 'refi'

const HARDCODED_SUBAREAS: { title: string; tagline: string; description: string; icon: SubareaIconType }[] = [
  {
    title: '(Sovereign) DPI',
    tagline: 'Digital Public Infrastructure',
    description: 'Nation-states run open, verifiable, privacy-preserving rails (identity, payments, registries, RWA, data + compute corridors).',
    icon: 'dpi',
  },
  {
    title: 'DeSci',
    tagline: 'Decentralized Science',
    description: 'Shifting from experiments to a full scientific stack (open data, reproducible research, verifiable pipelines, new funding instruments).',
    icon: 'desci',
  },
  {
    title: 'DePIN',
    tagline: 'Decentralized Physical Infrastructure Networks',
    description: 'DePIN becomes a mainstream infra category (sovereign compute, energy, sensing, mapping, telecom, and resilience networks).',
    icon: 'depin',
  },
  {
    title: 'Public Goods Funding',
    tagline: 'Sustainable Public Goods Markets',
    description: 'PGF evolves into public markets for public goods (sustainable co-funding, repeatable granting, clear measurement, institutional legitimacy).',
    icon: 'pgf',
  },
  {
    title: 'DeFi',
    tagline: 'Decentralized Finance',
    description: 'DeFi achieves global democratized access to payments and savings in valuable asset categories (major currencies, stocks, bonds).',
    icon: 'defi',
  },
  {
    title: 'DeGov',
    tagline: 'Decentralized Governance',
    description: 'Technology enables resilience towards misinformation and lifts the governance abilities of states and institutions.',
    icon: 'degov',
  },
  {
    title: 'Network States',
    tagline: 'Digital-First Societies',
    description: 'Network states develop permanent hubs and provide radical new ideas of how society can flourish.',
    icon: 'network-states',
  },
  {
    title: 'Improving Nations',
    tagline: 'Computing-Enabled National Development',
    description: 'Computing leapfrogs national economies and creates wealth and security for developing nations.',
    icon: 'nations',
  },
  {
    title: 'Climate / ReFi',
    tagline: 'Regenerative Finance',
    description: 'New mechanisms enable sustainable climate finance. DePIN and MRV technology tackle the climate and biodiversity crisis.',
    icon: 'refi',
  },
]

export default async function SubareasPage() {
  const page = await fetchPage("area-eg-subareas")
  const heroSection = getSection(page, "hero")
  const heroTitle = heroSection?.title || "Subareas"
  const heroSubtitle = heroSection?.subtitle || "Nine interconnected subfields, each representing a critical domain for economies and governance."
  const subareas = HARDCODED_SUBAREAS.map(sub => {
    const section = getSection(page, sub.icon)
    return {
      ...sub,
      title: section?.title || sub.title,
      tagline: section?.subtitle || sub.tagline,
      description: section?.body || sub.description,
    }
  })
  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Areas', href: '/areas/' },
          { label: 'Economies & Governance', href: '/areas/economies-governance/' },
          { label: 'Subareas' },
        ]}
      />

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl lg:text-[36px] font-semibold mb-3">{heroTitle}</h1>
        <MarkdownContent content={heroSubtitle} className="text-lg text-gray-600 leading-relaxed max-w-2xl" />
      </div>

      {/* Subareas grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
        {subareas.map((sub) => (
          <div key={sub.title} className="bg-white p-8 group">
            <div className="flex items-start gap-4">
              <SubareaIcon type={sub.icon} />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-black mb-1">{sub.title}</h3>
                <span className="text-sm text-gray-400">{sub.tagline}</span>
                <MarkdownContent content={sub.description} className="mt-3 text-sm text-gray-500 leading-relaxed [&_p]:mb-0" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400 leading-relaxed italic mt-10 max-w-xl">
        More subareas may emerge as the field grows. These subfields overlap and create new opportunity spaces at their convergence points.
      </p>
    </div>
  )
}

function SubareaIcon({ type }: { type: SubareaIconType }) {
  const baseClass = "w-10 h-10 shrink-0 text-blue/60 group-hover:text-blue transition-colors duration-300"
  
  switch (type) {
    case 'dpi':
      return <DPIIcon className={baseClass} />
    case 'desci':
      return <DeSciIcon className={baseClass} />
    case 'depin':
      return <DePINIcon className={baseClass} />
    case 'pgf':
      return <PGFIcon className={baseClass} />
    case 'defi':
      return <DeFiIcon className={baseClass} />
    case 'degov':
      return <DeGovIcon className={baseClass} />
    case 'network-states':
      return <NetworkStatesIcon className={baseClass} />
    case 'nations':
      return <NationsIcon className={baseClass} />
    case 'refi':
      return <ReFiIcon className={baseClass} />
  }
}

// Digital Public Infrastructure - Building/pillar with data flow
function DPIIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Building/pillar structure */}
      <rect x="14" y="10" width="12" height="24" className="stroke-current" strokeWidth="1.5" fill="none" rx="1">
        <animate attributeName="stroke-dasharray" values="0 80;80 0" dur="2s" fill="freeze" />
      </rect>
      {/* Horizontal data lines */}
      <line x1="6" y1="16" x2="14" y2="16" className="stroke-current" strokeWidth="1" opacity="0.5">
        <animate attributeName="x1" values="6;10;6" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="26" y1="16" x2="34" y2="16" className="stroke-current" strokeWidth="1" opacity="0.5">
        <animate attributeName="x2" values="34;30;34" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </line>
      <line x1="6" y1="22" x2="14" y2="22" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="x1" values="6;10;6" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </line>
      <line x1="26" y1="22" x2="34" y2="22" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="x2" values="34;30;34" dur="2s" repeatCount="indefinite" begin="0.8s" />
      </line>
      <line x1="6" y1="28" x2="14" y2="28" className="stroke-current" strokeWidth="1" opacity="0.3">
        <animate attributeName="x1" values="6;10;6" dur="2s" repeatCount="indefinite" begin="1s" />
      </line>
      <line x1="26" y1="28" x2="34" y2="28" className="stroke-current" strokeWidth="1" opacity="0.3">
        <animate attributeName="x2" values="34;30;34" dur="2s" repeatCount="indefinite" begin="1.3s" />
      </line>
      {/* Connection dots */}
      <circle cx="6" cy="16" r="1.5" className="fill-current" opacity="0.6">
        <animate attributeName="r" values="1;2;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="34" cy="22" r="1.5" className="fill-current" opacity="0.6">
        <animate attributeName="r" values="1;2;1" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </circle>
    </svg>
  )
}

// Decentralized Science - Flask with network nodes
function DeSciIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Flask outline */}
      <path
        d="M16 6V14L8 30C7 32 8.5 34 11 34H29C31.5 34 33 32 32 30L24 14V6"
        className="stroke-current"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      >
        <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
      </path>
      <line x1="14" y1="6" x2="26" y2="6" className="stroke-current" strokeWidth="1.5" />
      {/* Bubbles/nodes inside */}
      <circle cx="15" cy="26" r="2" className="fill-current" opacity="0.5">
        <animate attributeName="cy" values="26;23;26" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="28" r="1.5" className="fill-current" opacity="0.4">
        <animate attributeName="cy" values="28;25;28" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx="25" cy="26" r="2" className="fill-current" opacity="0.5">
        <animate attributeName="cy" values="26;23;26" dur="2s" repeatCount="indefinite" begin="0.6s" />
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" begin="0.6s" />
      </circle>
      {/* Connection lines between nodes */}
      <line x1="15" y1="26" x2="20" y2="28" className="stroke-current" strokeWidth="0.75" opacity="0.3" />
      <line x1="20" y1="28" x2="25" y2="26" className="stroke-current" strokeWidth="0.75" opacity="0.3" />
    </svg>
  )
}

// DePIN - Mesh network of infrastructure nodes
function DePINIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Hexagonal mesh pattern - 6 outer nodes + center */}
      {/* Center node */}
      <circle cx="20" cy="20" r="3" className="stroke-current" strokeWidth="1.5" fill="none">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="20" r="1.5" className="fill-current" opacity="0.6" />
      {/* Outer nodes */}
      <circle cx="20" cy="8" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="20" cy="8" r="1" className="fill-current" opacity="0.5" />
      <circle cx="30" cy="14" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="30" cy="14" r="1" className="fill-current" opacity="0.5" />
      <circle cx="30" cy="26" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="30" cy="26" r="1" className="fill-current" opacity="0.5" />
      <circle cx="20" cy="32" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="20" cy="32" r="1" className="fill-current" opacity="0.5" />
      <circle cx="10" cy="26" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="10" cy="26" r="1" className="fill-current" opacity="0.5" />
      <circle cx="10" cy="14" r="2.5" className="stroke-current" strokeWidth="1" fill="none" opacity="0.7" />
      <circle cx="10" cy="14" r="1" className="fill-current" opacity="0.5" />
      {/* Connection lines from center to outer */}
      <line x1="20" y1="17" x2="20" y2="11" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="22.5" y1="18" x2="27.5" y2="15" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </line>
      <line x1="22.5" y1="22" x2="27.5" y2="25" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.6s" />
      </line>
      <line x1="20" y1="23" x2="20" y2="29" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.9s" />
      </line>
      <line x1="17.5" y1="22" x2="12.5" y2="25" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="1.2s" />
      </line>
      <line x1="17.5" y1="18" x2="12.5" y2="15" className="stroke-current" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="1.5s" />
      </line>
    </svg>
  )
}

// Public Goods Funding - Coins flowing together
function PGFIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Central collection point */}
      <circle cx="20" cy="24" r="8" className="stroke-current" strokeWidth="1.5" fill="none">
        <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="24" r="3" className="fill-current" opacity="0.4" />
      {/* Incoming coins/circles */}
      <circle cx="8" cy="10" r="3" className="stroke-current" strokeWidth="1" fill="none" opacity="0.6">
        <animate attributeName="cy" values="10;14;10" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="6" r="3" className="stroke-current" strokeWidth="1" fill="none" opacity="0.6">
        <animate attributeName="cy" values="6;10;6" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx="32" cy="10" r="3" className="stroke-current" strokeWidth="1" fill="none" opacity="0.6">
        <animate attributeName="cy" values="10;14;10" dur="2s" repeatCount="indefinite" begin="0.6s" />
      </circle>
      {/* Flow lines */}
      <line x1="10" y1="12" x2="15" y2="18" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="20" y1="9" x2="20" y2="16" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </line>
      <line x1="30" y1="12" x2="25" y2="18" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.6s" />
      </line>
    </svg>
  )
}

// DeFi - Circular exchange arrows
function DeFiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Outer circle */}
      <circle cx="20" cy="20" r="14" className="stroke-current" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Rotating arrows */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 20 20;360 20 20" dur="8s" repeatCount="indefinite" />
        <path d="M20 6 L20 10 M17 8 L20 6 L23 8" className="stroke-current" strokeWidth="1.5" fill="none" />
        <path d="M34 20 L30 20 M32 17 L34 20 L32 23" className="stroke-current" strokeWidth="1.5" fill="none" />
        <path d="M20 34 L20 30 M23 32 L20 34 L17 32" className="stroke-current" strokeWidth="1.5" fill="none" />
        <path d="M6 20 L10 20 M8 23 L6 20 L8 17" className="stroke-current" strokeWidth="1.5" fill="none" />
      </g>
      {/* Center node */}
      <circle cx="20" cy="20" r="4" className="stroke-current" strokeWidth="1.5" fill="none">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="20" r="1.5" className="fill-current" opacity="0.6" />
    </svg>
  )
}

// DeGov - Ballot/vote with checkmark
function DeGovIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Ballot box */}
      <rect x="8" y="16" width="24" height="18" rx="2" className="stroke-current" strokeWidth="1.5" fill="none">
        <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
      </rect>
      <line x1="8" y1="22" x2="32" y2="22" className="stroke-current" strokeWidth="1" opacity="0.5" />
      {/* Slot */}
      <rect x="14" y="14" width="12" height="4" rx="1" className="stroke-current" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Ballot paper dropping */}
      <rect x="17" y="6" width="6" height="10" className="stroke-current" strokeWidth="1" fill="none" opacity="0.5">
        <animate attributeName="y" values="6;10;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
      </rect>
      {/* Checkmark */}
      <path d="M15 27 L18 30 L25 23" className="stroke-current" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-dasharray" values="0 20;20 0" dur="1s" fill="freeze" begin="1s" />
      </path>
    </svg>
  )
}

// Network States - Globe with connected nodes
function NetworkStatesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Globe outline */}
      <circle cx="20" cy="20" r="14" className="stroke-current" strokeWidth="1.5" fill="none" />
      {/* Latitude lines */}
      <ellipse cx="20" cy="20" rx="14" ry="5" className="stroke-current" strokeWidth="0.75" fill="none" opacity="0.4" />
      <ellipse cx="20" cy="14" rx="10" ry="3" className="stroke-current" strokeWidth="0.5" fill="none" opacity="0.3" />
      <ellipse cx="20" cy="26" rx="10" ry="3" className="stroke-current" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Longitude line */}
      <ellipse cx="20" cy="20" rx="5" ry="14" className="stroke-current" strokeWidth="0.75" fill="none" opacity="0.4" />
      {/* Network nodes on globe */}
      <circle cx="12" cy="16" r="2" className="fill-current" opacity="0.6">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="18" r="2" className="fill-current" opacity="0.6">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </circle>
      <circle cx="18" cy="28" r="2" className="fill-current" opacity="0.6">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" begin="1s" />
      </circle>
      {/* Connection lines */}
      <line x1="12" y1="16" x2="28" y2="18" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </line>
      <line x1="28" y1="18" x2="18" y2="28" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" begin="0.5s" />
      </line>
      <line x1="18" y1="28" x2="12" y2="16" className="stroke-current" strokeWidth="0.75" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" begin="1s" />
      </line>
    </svg>
  )
}

// Improving Nations - Upward growth chart
function NationsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Axis */}
      <line x1="8" y1="32" x2="8" y2="8" className="stroke-current" strokeWidth="1.5" opacity="0.5" />
      <line x1="8" y1="32" x2="34" y2="32" className="stroke-current" strokeWidth="1.5" opacity="0.5" />
      {/* Growth bars */}
      <rect x="12" y="26" width="4" height="6" className="fill-current" opacity="0.3">
        <animate attributeName="height" values="6;8;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="y" values="26;24;26" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="18" y="20" width="4" height="12" className="fill-current" opacity="0.4">
        <animate attributeName="height" values="12;14;12" dur="2s" repeatCount="indefinite" begin="0.3s" />
        <animate attributeName="y" values="20;18;20" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </rect>
      <rect x="24" y="14" width="4" height="18" className="fill-current" opacity="0.5">
        <animate attributeName="height" values="18;20;18" dur="2s" repeatCount="indefinite" begin="0.6s" />
        <animate attributeName="y" values="14;12;14" dur="2s" repeatCount="indefinite" begin="0.6s" />
      </rect>
      <rect x="30" y="10" width="4" height="22" className="fill-current" opacity="0.6">
        <animate attributeName="height" values="22;24;22" dur="2s" repeatCount="indefinite" begin="0.9s" />
        <animate attributeName="y" values="10;8;10" dur="2s" repeatCount="indefinite" begin="0.9s" />
      </rect>
      {/* Trend arrow */}
      <path d="M10 28 L32 10" className="stroke-current" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
      <polygon points="34,8 30,10 32,14" className="fill-current" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
      </polygon>
    </svg>
  )
}

// ReFi / Climate - Leaf with circular arrows
function ReFiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      {/* Leaf shape */}
      <path
        d="M20 8 C 30 12, 34 22, 28 32 C 24 28, 20 26, 12 28 C 8 18, 12 10, 20 8 Z"
        className="stroke-current"
        strokeWidth="1.5"
        fill="none"
      >
        <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
      </path>
      {/* Leaf vein */}
      <path d="M20 10 Q 22 20, 18 30" className="stroke-current" strokeWidth="1" fill="none" opacity="0.4" />
      {/* Circular arrows around leaf */}
      <g opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" values="0 20 20;360 20 20" dur="10s" repeatCount="indefinite" />
        <path d="M6 20 A 14 14 0 0 1 20 6" className="stroke-current" strokeWidth="1" fill="none" />
        <polygon points="20,4 18,8 22,8" className="fill-current" />
        <path d="M34 20 A 14 14 0 0 1 20 34" className="stroke-current" strokeWidth="1" fill="none" />
        <polygon points="20,36 22,32 18,32" className="fill-current" />
      </g>
      {/* Sun/energy dot */}
      <circle cx="28" cy="12" r="2" className="fill-current" opacity="0.5">
        <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

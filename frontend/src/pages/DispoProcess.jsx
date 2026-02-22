import { motion } from 'framer-motion'
import {
  Rocket,
  Crown,
  Globe,
  Users,
  ListChecks,
  Zap,
  Target,
  TrendingUp,
  Building2,
  Home,
  Hotel,
  Landmark,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const platforms = [
  {
    name: 'InvestorLift',
    icon: Rocket,
    description:
      'The #1 disposition platform for wholesalers. Connects you to a nationwide network of verified cash buyers with proof of funds, instant deal blasting, and built-in buyer scoring.',
    highlight: 'Nationwide verified buyer network',
  },
  {
    name: 'InvestorBase',
    icon: Users,
    description:
      'A curated database of active real estate investors. Access buyer profiles, transaction history, and preferences to match your deals with the right buyers instantly.',
    highlight: 'Curated investor database',
  },
  {
    name: 'CreativeListing.com',
    icon: Globe,
    description:
      'A marketplace built specifically for creative finance deals — Sub-To, seller finance, wraps, and more. Reach buyers who understand and actively seek creative deal structures.',
    highlight: 'Creative finance marketplace',
  },
  {
    name: 'Private Buyer Lists',
    icon: Crown,
    description:
      'Our proprietary, hand-curated lists of active buyers built from years of deal flow. These are buyers who have closed with us before and are ready to move fast on the right deal.',
    highlight: 'Exclusive proprietary lists',
  },
]

const buyerTypes = [
  {
    icon: Building2,
    type: 'Section 8 Investors',
    description: 'Buyers looking for government-subsidized rental income with guaranteed payments.',
    conventional: true,
  },
  {
    icon: Hotel,
    type: 'Short-Term Rental (STR)',
    description: 'Airbnb and VRBO operators seeking properties in high-demand tourist or metro areas.',
    conventional: true,
  },
  {
    icon: Home,
    type: 'Mid-Term Rental (MTR)',
    description: 'Furnished rentals for traveling nurses, corporate housing, and 30-90 day stays.',
    conventional: true,
  },
  {
    icon: Landmark,
    type: 'Long-Term Rental (LTR)',
    description: 'Traditional buy-and-hold investors looking for steady cash flow with 12+ month leases.',
    conventional: true,
  },
  {
    icon: Zap,
    type: 'Fix & Flip Investors',
    description: 'Buyers who renovate and resell for profit. Quick closers who want deep discounts.',
    conventional: false,
  },
  {
    icon: Target,
    type: 'Novation Buyers',
    description: 'Investors who purchase through novation agreements — a non-conventional strategy most wholesalers miss.',
    conventional: false,
  },
  {
    icon: TrendingUp,
    type: 'Creative Finance Buyers',
    description: 'Buyers specifically looking for Sub-To, seller finance, and wrap deals. They pay MORE because of favorable terms.',
    conventional: false,
  },
  {
    icon: ShieldCheck,
    type: 'Land Trust Investors',
    description: 'Sophisticated buyers who acquire through land trusts for asset protection and privacy.',
    conventional: false,
  },
]

export default function DispoProcess() {
  const conventionalBuyers = buyerTypes.filter((b) => b.conventional)
  const nonConventionalBuyers = buyerTypes.filter((b) => !b.conventional)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1000px] mx-auto"
    >
      {/* Parchment-texture strategy map container */}
      <div className="relative parchment-texture rounded-sm border border-gold-dim/20 px-6 sm:px-10 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Rocket size={28} className="text-gold" />
            <h1 className="font-display text-4xl gold-shimmer-text tracking-[0.06em]">
              The Strategy Board
            </h1>
          </div>
          <p className="font-heading tracking-wide text-text-dim text-base max-w-2xl mx-auto leading-relaxed">
            We give you access to the best disposition tools on the market — period.
            While most wholesalers are limited to selling to Section 8, STR, MTR,
            and LTR buyers, our network goes far beyond that, giving you a{' '}
            <span className="text-gold font-semibold">
              significantly larger buyer pool
            </span>{' '}
            to get your deals sold faster and at higher prices.
          </p>
        </div>

        {/* Key advantage banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <WoodPanel glow headerBar="Strategic Advantage">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center shrink-0">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-wide text-gold mb-0.5">
                  Our Competitive Advantage
                </p>
                <p className="text-sm text-text-dim">
                  Most investors only sell to conventional buyer types. We tap into
                  non-conventional investor lists — fix & flip, novation, creative
                  finance, and land trust buyers — giving you access to buyers that
                  your competition doesn't even know exist.
                </p>
              </div>
            </div>
          </WoodPanel>
        </motion.div>

        {/* Katana divider */}
        <div className="katana-line mb-10" />

        {/* Platforms section */}
        <div className="mb-10">
          <h2 className="font-display text-2xl gold-shimmer-text tracking-[0.06em] mb-1 text-center">
            Our Disposition Platforms
          </h2>
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mt-3 mb-5 text-center">
            Industry-leading tools that put your deals in front of thousands of qualified buyers
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {platforms.map((platform) => (
              <motion.div key={platform.name} variants={cardVariants}>
                <WoodPanel className="h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center">
                      <platform.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold tracking-wide text-parchment">
                        {platform.name}
                      </h3>
                      <p className="text-[11px] text-gold">{platform.highlight}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-dim leading-relaxed">
                    {platform.description}
                  </p>
                </WoodPanel>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Katana divider */}
        <div className="katana-line mb-10" />

        {/* Buyer types section */}
        <div className="mb-10">
          <h2 className="font-display text-2xl gold-shimmer-text tracking-[0.06em] mb-1 text-center">
            Who We Sell To
          </h2>
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mt-3 mb-5 text-center">
            Our buyer network spans both conventional and non-conventional investor types
          </p>

          {/* Conventional */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <h3 className="font-heading text-[11px] font-semibold tracking-[0.18em] text-text-muted uppercase">
                Conventional Buyers
              </h3>
              <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full border border-gold-dim/[0.15]">
                What everyone sells to
              </span>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {conventionalBuyers.map((buyer) => (
                <motion.div key={buyer.type} variants={cardVariants}>
                  <WoodPanel className="border-gold-dim/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                        <buyer.icon size={16} className="text-text-dim" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium tracking-wide text-parchment">
                          {buyer.type}
                        </p>
                        <p className="text-xs text-text-dim mt-0.5 leading-relaxed">
                          {buyer.description}
                        </p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Non-conventional with gold highlight */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <h3 className="font-heading text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
                Non-Conventional Buyers
              </h3>
              <span className="text-[10px] text-gold px-2 py-0.5 rounded-full border border-gold/25 bg-gold/[0.06]">
                Our advantage
              </span>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {nonConventionalBuyers.map((buyer) => (
                <motion.div key={buyer.type} variants={cardVariants}>
                  <WoodPanel glow>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg hanko-seal flex items-center justify-center shrink-0">
                        <buyer.icon size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium tracking-wide text-parchment">
                          {buyer.type}
                        </p>
                        <p className="text-xs text-text-dim mt-0.5 leading-relaxed">
                          {buyer.description}
                        </p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Katana divider */}
        <div className="katana-line mb-10" />

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <WoodPanel glow className="text-center">
            <h3 className="font-display text-2xl gold-shimmer-text tracking-[0.06em] mb-2">
              Bigger Buyer Pool = Faster Sales = More Money
            </h3>
            <p className="text-sm text-text-dim max-w-lg mx-auto mb-5">
              When you JV with us, you're not just getting a deal partner — you're
              getting access to the most comprehensive disposition network in the game.
              Your deals don't sit. They sell.
            </p>
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 gold-shimmer text-ink font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm">
                Start using these tools today
                <ArrowRight size={16} />
              </span>
            </div>
          </WoodPanel>
        </motion.div>
      </div>
    </motion.div>
  )
}

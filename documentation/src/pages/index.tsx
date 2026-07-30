/**
 * Homepage — index.tsx
 *
 * Issue #134: Page Speed Optimization
 * - Testimonials and NewsletterSignup are below-fold; lazy-loaded via
 *   React.lazy + Suspense so they are excluded from the critical bundle.
 * - A lightweight IntersectionObserver-based hook defers rendering until
 *   the section scrolls into view, reducing main-thread work on load.
 * - PatternPreview, Stats, and QuickStartSection remain eagerly loaded
 *   because they appear above the fold on most viewport sizes.
 */
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import PatternPreview, { Pattern } from '@site/src/components/PatternPreview';
import Layout from '@theme/Layout';
import Stats from '@site/src/components/Stats';
import QuickStartSection from '@site/src/components/QuickStartSection';
import { trackCtaClick } from '@site/src/utils/analytics';
import styles from './index.module.css';

// ── Lazy-loaded below-fold components ─────────────────────────────────────────
// Splitting these out keeps them out of the initial JS bundle, reducing parse
// time and improving TTI / LCP on the critical above-fold content.
const NewsletterSignup = lazy(
  () => import('@site/src/components/NewsletterSignup'),
);
const Testimonials = lazy(
  () => import('@site/src/components/UI/Testimonials'),
);

// ── IntersectionObserver hook ─────────────────────────────────────────────────
// Returns true once the ref'd element enters the viewport (with a 200 px
// rootMargin so content starts loading just before it scrolls into view).
// Falls back to `true` immediately in environments without IntersectionObserver
// (e.g. SSR / old browsers) so nothing is hidden.
function useInView(rootMargin = '200px'): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
}

// ── Minimal skeleton shown while lazy chunks load ────────────────────────────
function SectionSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        background: 'var(--ifm-background-surface-color, #f0f0f0)',
        borderRadius: 8,
        margin: '2rem auto',
        maxWidth: 960,
      }}
    />
  );
}

// ── Pattern data ─────────────────────────────────────────────────────────────
const samplePatterns: Pattern[] = [
  {
    id: '1',
    contractName: 'hello_world',
    description:
      'A minimal contract demonstrating persistent storage and basic contract structure.',
    tag: '#storage',
    category: 'storage',
    difficulty: 'beginner',
    popularity: 95,
    code: `pub fn hello(env: Env) -> String {
    env.storage().instance().get(&String::from_slice(&env, "hello"))
        .unwrap_or(String::from_slice(&env, "Hello, Soroban!"))
}`,
    href: '/docs/patterns/hello-world',
    icon: '👋',
  },
  {
    id: '2',
    contractName: 'token_contract',
    description:
      'Implementation of a fungible token with mint, transfer, and balance functionality.',
    tag: '#tokens',
    category: 'tokens',
    difficulty: 'intermediate',
    popularity: 88,
    code: `pub fn mint(env: Env, to: Address, amount: i128) {
    env.storage().instance().extend_ttl(100, 100);
    // Mint logic here
}`,
    href: '/docs/patterns/token-contract',
    icon: '🪙',
  },
  {
    id: '3',
    contractName: 'voting_contract',
    description: 'Decentralized voting system with proposal creation and voting mechanisms.',
    tag: '#governance',
    category: 'governance',
    difficulty: 'advanced',
    popularity: 76,
    code: `pub fn vote(env: Env, voter: Address, proposal_id: u64, choice: bool) {
    require_auth(voter);
    // Voting logic here
}`,
    href: '/docs/patterns/voting-contract',
    icon: '🗳️',
  },
  {
    id: '4',
    contractName: 'nft_contract',
    description: 'Non-fungible token contract with mint, transfer, and metadata support.',
    tag: '#nft',
    category: 'nft',
    difficulty: 'intermediate',
    popularity: 82,
    code: `pub fn mint_nft(env: Env, to: Address, token_id: u64, metadata: String) {
    // NFT minting logic
}`,
    href: '/docs/patterns/nft-contract',
    icon: '🎨',
  },
  {
    id: '5',
    contractName: 'liquidity_pool',
    description: 'Automated market maker with liquidity provision and swap functionality.',
    tag: '#defi',
    category: 'defi',
    difficulty: 'advanced',
    popularity: 79,
    code: `pub fn swap(env: Env, token_a: Address, token_b: Address, amount_in: i128) -> i128 {
    // AMM swap logic
}`,
    href: '/docs/patterns/liquidity-pool',
    icon: '💧',
  },
  {
    id: '6',
    contractName: 'multisig_wallet',
    description: 'Multi-signature wallet for secure fund management with threshold requirements.',
    tag: '#utility',
    category: 'utility',
    difficulty: 'advanced',
    popularity: 71,
    code: `pub fn submit_transaction(env: Env, from: Address, to: Address, amount: i128) {
    // Multisig transaction logic
}`,
    href: '/docs/patterns/multisig-wallet',
    icon: '🔐',
  },
  {
    id: '7',
    contractName: 'time_lock',
    description: 'Time-locked contract for delayed fund release with vesting schedules.',
    tag: '#utility',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 68,
    code: `pub fn lock_funds(env: Env, amount: i128, release_time: u64) {
    // Time lock logic
}`,
    href: '/docs/patterns/time-lock',
    icon: '⏰',
  },
  {
    id: '8',
    contractName: 'escrow_contract',
    description: 'Secure escrow service for conditional fund release between parties.',
    tag: '#utility',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 74,
    code: `pub fn create_escrow(env: Env, buyer: Address, seller: Address, amount: i128) {
    // Escrow creation logic
}`,
    href: '/docs/patterns/escrow-basic',
    icon: '🤝',
  },
];

// ── Page component ────────────────────────────────────────────────────────────
export default function Home() {
  // Defer rendering of below-fold sections until they near the viewport.
  const [newsletterRef, newsletterInView] = useInView();
  const [testimonialsRef, testimonialsInView] = useInView();

  return (
    <Layout
      title="Soroban Cookbook"
      description="Master Soroban smart contracts with practical patterns and production-ready guides.">
      {/* ── Above-fold hero ───────────────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.glowOne}></div>
        <div className={styles.glowTwo}></div>

        <div className={styles.container}>
          <h1 className={styles.title}>Build Smart Contracts</h1>

          <p className={styles.subtitle}>
            A modern, practical guide to building secure and optimized Soroban applications on
            Stellar.
          </p>

          <div className={styles.buttons}>
            <Link
              to="/docs"
              className={styles.primaryBtn}
              onClick={() => trackCtaClick('hero_get_started', '/docs')}>
              Get Started
            </Link>

            <Link
              to="/docs/patterns/overview"
              className={styles.secondaryBtn}
              onClick={() => trackCtaClick('hero_view_patterns', '/docs/patterns/overview')}>
              View Patterns
            </Link>
          </div>

          <div className={styles.features}>
            <div>⚡ Production-ready examples</div>
            <div>🔐 Security-first patterns</div>
            <div>📦 Reusable contract modules</div>
            <div>🚀 Performance optimization tips</div>
          </div>
        </div>
      </header>

      {/* ── Critical above-fold content ──────────────────────────────────── */}
      <div className={styles.container}>
        <PatternPreview
          patterns={samplePatterns}
          title="Popular Patterns"
          subtitle="Explore production-ready smart contract patterns used by developers worldwide"
          showViewAll={true}
          viewAllHref="/docs/patterns/overview"
          maxVisible={6}
          enableCarousel={true}
        />
        <Stats />
      </div>

      <QuickStartSection />

      {/* ── Below-fold: lazy-loaded with IntersectionObserver deferral ────── */}
      {/* NewsletterSignup */}
      <div ref={newsletterRef}>
        {newsletterInView && (
          <Suspense fallback={<SectionSkeleton height={220} />}>
            <NewsletterSignup />
          </Suspense>
        )}
      </div>

      {/* Testimonials */}
      <div ref={testimonialsRef}>
        {testimonialsInView && (
          <Suspense fallback={<SectionSkeleton height={300} />}>
            <Testimonials />
          </Suspense>
        )}
      </div>
    </Layout>
  );
}

/**
 * Patterns Overview — /docs/patterns/overview
 *
 * Replaces docs/patterns/overview.md with a React page so we can mount
 * PatternFilterBar and apply usePatternFilter client-side without a full
 * page reload.
 *
 * All pattern data lives here. To add a new pattern, append an entry to
 * ALL_PATTERNS below.
 */

import React, { useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import PatternFilterBar from '@site/src/components/PatternFilterBar';
import PatternCard from '@site/src/components/cards/PatternCard';
import { usePatternFilter } from '@site/src/hooks/usePatternFilter';
import { sanitizeUrl } from '@site/src/utils/sanitizeUrl';
import type { Pattern } from '@site/src/components/PatternPreview';
import styles from './overview.module.css';

// ── Pattern catalogue ─────────────────────────────────────────────────────────

const ALL_PATTERNS: Pattern[] = [
  // ── Beginner ───────────────────────────────────────────────────────────────
  {
    id: 'hello-world',
    contractName: 'hello_world',
    description:
      'Minimal contract demonstrating instance storage and basic contract structure. The ideal first pattern.',
    tag: '#storage',
    category: 'storage',
    difficulty: 'beginner',
    popularity: 95,
    icon: '👋',
    href: '/docs/patterns/hello-world',
    code: `pub fn hello(env: Env) -> String {
    env.storage().instance()
        .get(&"msg").unwrap_or(String::from_str(&env, "Hello!"))
}`,
  },
  {
    id: 'basic-token',
    contractName: 'basic_token',
    description:
      'Fungible token with mint, transfer, and balance functions. Foundation for SEP-41 and custom token work.',
    tag: '#tokens',
    category: 'tokens',
    difficulty: 'beginner',
    popularity: 88,
    icon: '🪙',
    href: '/docs/patterns/basic-token',
    code: `pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    from.require_auth();
    // transfer logic
}`,
  },
  // ── Intermediate ───────────────────────────────────────────────────────────
  {
    id: 'custom-types',
    contractName: 'custom_types',
    description:
      'Custom struct and enum types in contract storage. Shows serialisation, versioning, and type safety patterns.',
    tag: '#storage',
    category: 'storage',
    difficulty: 'intermediate',
    popularity: 72,
    icon: '📦',
    href: '/docs/patterns/custom-types',
    code: `#[contracttype]
pub struct Config { pub admin: Address, pub fee_bps: u32 }`,
  },
  {
    id: 'error-handling',
    contractName: 'error_handling',
    description:
      'Error taxonomy, custom contracterror enums, propagation strategies, and user-facing clarity patterns.',
    tag: '#errors',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 84,
    icon: '🚨',
    href: '/docs/patterns/error-handling',
    code: `#[contracterror]
pub enum Error { NotFound = 1, Unauthorised = 2 }`,
  },
  {
    id: 'error-recovery',
    contractName: 'error_recovery',
    description:
      'Result types, fallback logic, graceful degradation, and input validation for production-ready contracts.',
    tag: '#errors',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 78,
    icon: '🛡️',
    href: '/docs/patterns/error-recovery',
    code: `pub fn safe_op(env: Env) -> Result<i128, Error> {
    let val = read_val(&env)?;
    Ok(val)
}`,
  },
  {
    id: 'timelock-vault',
    contractName: 'timelock_vault',
    description:
      'Lock assets until a scheduled timestamp, then release them to a beneficiary. Covers vesting and time-gated releases.',
    tag: '#storage',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 74,
    icon: '⏰',
    href: '/docs/patterns/timelock-vault',
    code: `pub fn withdraw(env: Env) -> Result<i128, Error> {
    if env.ledger().timestamp() < unlock_time { Err(Error::Locked) }
    else { Ok(amount) }
}`,
  },
  {
    id: 'escrow-multiparty',
    contractName: 'escrow_multiparty',
    description:
      'Three-role escrow (depositor, recipient, arbitrator) with dispute resolution and multi-sig-style release flow.',
    tag: '#utility',
    category: 'utility',
    difficulty: 'intermediate',
    popularity: 76,
    icon: '🤝',
    href: '/docs/patterns/escrow-multiparty',
    code: `pub fn resolve(env: Env, release_to_recipient: bool) -> Result<i128, Error> {
    arbitrator.require_auth();
    // route funds
}`,
  },
  {
    id: 'token-standards',
    contractName: 'token_standards',
    description:
      'SEP-41 token interface, Stellar Asset Contract (SAC) integration, custom tokens, and NFTs — the complete picture.',
    tag: '#tokens',
    category: 'tokens',
    difficulty: 'intermediate',
    popularity: 82,
    icon: '📋',
    href: '/docs/patterns/token-standards',
    code: `// SEP-41 interface excerpt
fn transfer(env: Env, from: Address, to: Address, amount: i128);`,
  },
  // ── Advanced ───────────────────────────────────────────────────────────────
  {
    id: 'authorization',
    contractName: 'authorization',
    description:
      'Roles, capability boundaries, multi-level auth trees, and cross-contract authorisation patterns.',
    tag: '#auth',
    category: 'utility',
    difficulty: 'advanced',
    popularity: 90,
    icon: '🔐',
    href: '/docs/patterns/authorization',
    code: `pub fn admin_action(env: Env, admin: Address) {
    admin.require_auth();
    // privileged op
}`,
  },
  {
    id: 'oracle-consumer',
    contractName: 'oracle_consumer',
    description:
      'Read external price feeds via cross-contract calls. Covers staleness checks, fallbacks, and circuit breakers.',
    tag: '#events',
    category: 'defi',
    difficulty: 'advanced',
    popularity: 69,
    icon: '🔮',
    href: '/docs/patterns/oracle-consumer',
    code: `let price = OracleClient::new(&env, &oracle_id)
    .get_price(&asset);`,
  },
  {
    id: 'proposal-lifecycle',
    contractName: 'proposal_lifecycle',
    description:
      'DAO proposal state machine: Pending → Active → Succeeded/Defeated → Executed. Covers quorum, timelock, and execution.',
    tag: '#governance',
    category: 'governance',
    difficulty: 'advanced',
    popularity: 73,
    icon: '🗳️',
    href: '/docs/patterns/proposal-lifecycle',
    code: `pub fn execute(env: Env, proposal_id: u64) -> Result<(), Error> {
    require_state(&env, proposal_id, State::Succeeded)?;
    // execute payload
}`,
  },
  {
    id: 'lifecycle-upgrades',
    contractName: 'lifecycle_upgrades',
    description:
      'Upgrading contract WASM, migrating storage layout, and handling version transitions safely.',
    tag: '#storage',
    category: 'utility',
    difficulty: 'advanced',
    popularity: 67,
    icon: '🔄',
    href: '/docs/patterns/lifecycle-upgrades',
    code: `pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
    admin.require_auth();
    env.deployer().update_current_contract_wasm(new_wasm_hash);
}`,
  },
  {
    id: 'optimization-playbook',
    contractName: 'optimization_playbook',
    description:
      'Gas-optimisation techniques: storage tiering, lazy computation, batch operations, and resource metering.',
    tag: '#optimization',
    category: 'utility',
    difficulty: 'advanced',
    popularity: 71,
    icon: '⚡',
    href: '/docs/patterns/optimization-playbook',
    code: `// Prefer temporary over persistent for ephemeral state
env.storage().temporary().set(&key, &val);`,
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PatternsOverview(): React.JSX.Element {
  const {
    filters,
    setCategory,
    setDifficulty,
    toggleTag,
    setSearch,
    resetFilters,
    applyFilters,
    activeFilterCount,
  } = usePatternFilter();

  const filtered = useMemo(() => applyFilters(ALL_PATTERNS), [applyFilters]);

  return (
    <Layout
      title="Pattern Library — Soroban Cookbook"
      description="Browse and filter production-ready Soroban smart contract patterns by category, difficulty, and topic.">
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.heroTitle}>Pattern Library</h1>
          <p className={styles.heroSubtitle}>
            Production-ready Soroban smart contract patterns — filter by category, difficulty,
            or topic to find what you need.
          </p>
        </header>

        <div className={styles.content}>
          {/* Filter bar */}
          <PatternFilterBar
            filters={filters}
            setCategory={setCategory}
            setDifficulty={setDifficulty}
            toggleTag={toggleTag}
            setSearch={setSearch}
            resetFilters={resetFilters}
            activeFilterCount={activeFilterCount}
            totalCount={ALL_PATTERNS.length}
            filteredCount={filtered.length}
          />

          {/* Pattern grid */}
          {filtered.length > 0 ? (
            <div className={styles.grid} aria-label="Pattern grid">
              {filtered.map((pattern) => (
                <div key={pattern.id} className={styles.cardWrapper}>
                  <PatternCard
                    contractName={pattern.contractName}
                    description={pattern.description}
                    tag={pattern.tag}
                    code={pattern.code}
                    href={pattern.href ? sanitizeUrl(pattern.href) : undefined}
                    icon={pattern.icon}
                  />
                  <div className={styles.cardMeta}>
                    <span
                      className={styles.difficulty}
                      data-difficulty={pattern.difficulty}>
                      {pattern.difficulty}
                    </span>
                    <span className={styles.category}>{pattern.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty} role="status">
              <p>No patterns match the active filters.</p>
              <button className={styles.resetBtn} onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          )}

          {/* Contributing callout */}
          <aside className={styles.contribute}>
            <p>
              Have a pattern to share?{' '}
              <Link to="/docs/contributing/add-tested-example">
                See the contributing guide →
              </Link>
            </p>
          </aside>
        </div>
      </main>
    </Layout>
  );
}

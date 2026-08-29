---
title: Pattern library
description: Reusable Soroban smart contract patterns — storage, tokens, DeFi, and more.
image: /img/soroban-social-card.png
---

# Pattern Library

Reusable smart contract patterns for common use cases.

## Template example

The **[Hello World storage](/docs/patterns/hello-world)** pattern demonstrates the standard pattern page layout (metadata, prerequisites, implementation with code tabs, security, and related links). Copy its structure when adding new patterns.

## Available Patterns

Browse battle-tested contract patterns for various use cases.

### [Hello World Storage](/docs/patterns/hello-world)

<span class="sb-badge sb-badge--beginner">Beginner</span> <span class="sb-tag sb-tag--storage">Storage</span> <span class="sb-badge sb-badge--stable">Stable</span>

Minimal Soroban contract demonstrating instance storage. Perfect starting point for understanding contract structure and basic storage operations.

### [Error Handling](/docs/patterns/error-handling)

**Difficulty**: Intermediate | **Category**: Architecture | **Status**: Stable

Error taxonomy, custom error patterns, error propagation strategies, and user-facing clarity recommendations for robust contract behavior.

### [Error Recovery](/docs/patterns/error-recovery)

<span class="sb-badge sb-badge--intermediate">Intermediate</span> <span class="sb-tag sb-tag--error-handling">Error Handling</span> <span class="sb-badge sb-badge--stable">Stable</span>

Comprehensive error handling patterns including Result types, fallback logic, graceful degradation, transaction rollback, and input validation. Essential for production-ready contracts.

## Pattern Categories

### 🪙 Token Standards

<span class="sb-tag sb-tag--token">Token</span>

- Basic token implementations
- Token wrappers and vaults
- Multi-token systems

### 💰 DeFi Patterns

<span class="sb-tag sb-tag--defi">DeFi</span>

- Escrow contracts
- Atomic swaps
- Liquidity pools
- Timelock mechanisms

### 🗳️ Governance

<span class="sb-tag sb-tag--governance">Governance</span>

- Simple voting systems
- DAO implementations
- Proposal mechanisms

### ⚡ Advanced Patterns

<span class="sb-badge sb-badge--advanced">Advanced</span>

- Cross-contract calls
- Upgradeable contracts
- Oracle integration

## Using Patterns

The patterns in this library provide practical, battle-tested Soroban contract examples covering common use cases such as storage, tokens, DeFi, access control, and governance. Each pattern is designed to be immediately useful and includes the following:

- **Source code** — Complete contract implementations with `#[contract]` and `#[contractimpl]` blocks
- **Tests** — Unit tests embedded within each pattern for verification of contract behavior
- **Security considerations** — Highlighted callouts and checklists addressing common security pitfalls, storage scope, authorization, and production readiness
- **Best practice callouts** — Guidance on topics such as input validation, error handling, and graceful degradation
- **Related patterns and concepts** — Links to connected patterns, concepts, and external resources for deeper learning

Some patterns also include deployment guidance, state migration strategies, and optimization techniques. The [hello world storage](/docs/patterns/hello-world) pattern demonstrates the standard pattern page layout and can be used as a template when adding new patterns.

Browse the [Available Patterns](/docs/patterns/overview) to find the right pattern for your use case.

## Contributing

Have a pattern to share? See our [Contributing Guide](https://github.com/Soroban-Cookbook/Soroban-Cookbook-/blob/main/CONTRIBUTING.md).

## Getting Started

Start exploring:

1. Review the [Core Concepts](../concepts/overview.md)
2. Pick a pattern that fits your use case
3. Study the implementation
4. Adapt it to your needs

## Resources

- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Community Patterns](https://github.com/Soroban-Cookbook/Soroban-Cookbook-)

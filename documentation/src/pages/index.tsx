import Link from '@docusaurus/Link';
import PatternPreview, { Pattern } from '@site/src/components/PatternPreview';
import Layout from '@theme/Layout';
import Stats from '@site/src/components/Stats';
import QuickStartSection from '@site/src/components/QuickStartSection';
import NewsletterSignup from '@site/src/components/NewsletterSignup';
import Testimonials from '@site/src/components/UI/Testimonials';
import { trackCtaClick } from '@site/src/utils/analytics';
import styles from './index.module.css';
import React from 'react';
import { samplePatterns } from '@site/src/fixtures/patterns';


export default function Home() {
  return (
    <Layout
      title="Soroban Cookbook"
      description="Master Soroban smart contracts with practical patterns and production-ready guides.">
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
      <NewsletterSignup />
      <Testimonials />
    </Layout>
  );
}

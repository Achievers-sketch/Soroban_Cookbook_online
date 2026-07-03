import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Soroban Cookbook',
  tagline: 'A comprehensive guide to building smart contracts on Stellar with Soroban',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://soroban-cookbook.dev',
  baseUrl: '/',

  organizationName: 'Soroban-Cookbook',
  projectName: 'Soroban_Cookbook_online',

  customFields: {
    // POST endpoint accepting JSON `{ "email": string }`.
    // Set via env at build time for real integrations.
    newsletterEndpoint: process.env.NEWSLETTER_ENDPOINT ?? '',
    /** Soroban Cookbook Discord invite link. Set DISCORD_INVITE_URL at build time once the server is created. */
    discordInviteUrl: process.env.DISCORD_INVITE_URL ?? '',
    /**
     * Sentry DSN for error monitoring (issue #136).
     * Set SENTRY_DSN in your CI/CD environment or .env.local.
     * When absent, Sentry is not initialised (safe for local dev).
     */
    sentryDsn: process.env.SENTRY_DSN ?? '',
  },

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Theme initialization script to prevent flash of incorrect theme
  scripts: [
    {
      src: '/js/themeInit.js',
      async: false,
    },
  ],

  // Meta tags for theme color + social previews (see CONTRIBUTING — SEO & social metadata)
  headTags: [
    // Content Security Policy
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https:",
        ].join('; '),
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#1e1e2e',
      },
    },
    // Content-Security-Policy fallback for hosts that cannot set custom HTTP
    // response headers (e.g. GitHub Pages). Hosts that can set real headers
    // (Vercel via vercel.json, Netlify/Cloudflare Pages via static/_headers)
    // should rely on those instead — a header-based CSP also covers
    // `frame-ancestors`, which browsers ignore when delivered via <meta>.
    // See DEPLOYMENT.md → Security Headers for the full policy rationale.
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content:
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://api.dicebear.com; font-src 'self' data:; connect-src 'self' https:; form-action 'self' https:; object-src 'none'; base-uri 'self'",
      },
    },
    // Preload the Inter variable font (latin woff2) — critical for above-the-fold text.
    // The href must match the path emitted by @fontsource-variable/inter after build.
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/assets/fonts/inter-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    // Preload JetBrains Mono for code blocks.
    {
      tagName: 'link',
      attributes: {
        rel: 'preload',
        href: '/assets/fonts/jetbrains-mono-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'Soroban Cookbook',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image',
        content: 'https://soroban-cookbook.dev/img/soroban-social-card.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image:width',
        content: '1200',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image:height',
        content: '630',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:image',
        content: 'https://soroban-cookbook.dev/img/soroban-social-card.png',
      },
    },
  ],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        indexDocs: true,
        indexPages: true,
        indexBlog: false,
      },
    ],
    // ─── 301 Redirects ────────────────────────────────────────────────────────
    // Maps old/removed paths → current canonical paths so bookmarks and
    // external links continue to resolve after pages are renamed or moved.
    // Add new entries here whenever a doc is renamed or relocated.
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          // website/ → documentation/ directory rename (legacy root paths)
          {
            from: '/docs/intro',
            to: '/docs/concepts/introduction',
          },
          // Getting Started renames
          {
            from: '/docs/setup',
            to: '/docs/getting-started/setup',
          },
          {
            from: '/docs/getting-started/installation',
            to: '/docs/getting-started/setup',
          },
          {
            from: '/docs/getting-started/setup-macos',
            to: '/docs/getting-started/setup',
          },
          {
            from: '/docs/first-contract',
            to: '/docs/getting-started/first-contract',
          },
          {
            from: '/docs/getting-started/build',
            to: '/docs/getting-started/building-and-compilation',
          },
          {
            from: '/docs/getting-started/deploy',
            to: '/docs/getting-started/deploy-testnet',
          },
          {
            from: '/docs/getting-started/interaction',
            to: '/docs/getting-started/contract-interaction',
          },
          // Concepts renames
          {
            from: '/docs/concepts',
            to: '/docs/concepts/introduction',
          },
          {
            from: '/docs/concepts/intro',
            to: '/docs/concepts/introduction',
          },
          {
            from: '/docs/concepts/gas',
            to: '/docs/concepts/gas-and-resources',
          },
          {
            from: '/docs/concepts/cross-contract',
            to: '/docs/concepts/cross-contract-invocation',
          },
          // Patterns renames
          {
            from: '/docs/patterns',
            to: '/docs/patterns/overview',
          },
          {
            from: '/docs/patterns/types',
            to: '/docs/patterns/custom-types',
          },
          {
            from: '/docs/patterns/auth',
            to: '/docs/patterns/authorization',
          },
          {
            from: '/docs/patterns/upgrades',
            to: '/docs/patterns/lifecycle-upgrades',
          },
          {
            from: '/docs/patterns/optimization',
            to: '/docs/patterns/optimization-playbook',
          },
          // Contributing renames
          {
            from: '/docs/contributing/guide',
            to: '/docs/contributing',
          },
          {
            from: '/docs/contributing/tested-example',
            to: '/docs/contributing/add-tested-example',
          },
          // Legacy tutorial paths from initial Docusaurus scaffold
          {
            from: '/docs/tutorial-basics/create-a-document',
            to: '/docs/getting-started/first-contract',
          },
          {
            from: '/docs/tutorial-basics/deploy-your-site',
            to: '/docs/getting-started/deploy-testnet',
          },
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl:
            'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online/tree/main/documentation/',
        },
        blog: false,
        theme: {
          customCss: [
            './src/css/fonts.css',
            './src/css/design-tokens.css',
            './src/css/breakpoints.css',
            './src/css/badges-tags.css',
            './src/css/custom.css',
            './src/css/search-experience.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/soroban-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Soroban Cookbook',
      logo: {
        alt: 'Soroban Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: process.env.DISCORD_INVITE_URL ?? 'https://discord.gg/YNBu3jKEF',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'Documentation',
              to: '/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Soroban Cookbook Discord',
              href: process.env.DISCORD_INVITE_URL ?? 'https://discord.gg/YNBu3jKEF',
            },
            {
              label: 'Stellar Discord',
              href: 'https://discord.gg/YNBu3jKEF',
            },
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/soroban',
            },
            {
              label: 'Code of Conduct',
              href: 'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online/blob/main/CODE_OF_CONDUCT.md',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Soroban Docs',
              href: 'https://developers.stellar.org/docs/build/smart-contracts',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Soroban-Cookbook/Soroban_Cookbook_online',
            },
          ],
        },
      ],
      copyright: `Built by the community • Powered by Stellar • MIT License • © ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['rust', 'toml', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

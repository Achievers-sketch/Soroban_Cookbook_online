import React, { type ReactNode } from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useSidebarBreadcrumbs, useDoc } from '@docusaurus/plugin-content-docs/client';
import { generateBreadcrumbSchema, type BreadcrumbItem } from '@site/src/utils/breadcrumbSchema';

export type Props = {
  breadcrumbs?: BreadcrumbItem[] | null;
};

/**
 * Custom theme swizzle for DocBreadcrumbs/StructuredData.
 * Injects BreadcrumbList JSON-LD schema into documentation page head tags.
 */
export default function DocBreadcrumbsStructuredData(props: Props): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  let sidebarBreadcrumbs: BreadcrumbItem[] | null = null;
  if (props.breadcrumbs !== undefined) {
    sidebarBreadcrumbs = props.breadcrumbs;
  } else {
    try {
      sidebarBreadcrumbs = useSidebarBreadcrumbs() as BreadcrumbItem[] | null;
    } catch {
      // Gracefully handle pages outside DocsSidebarProvider
      sidebarBreadcrumbs = null;
    }
  }

  let docMetadata: { title?: string; permalink?: string } | undefined;
  try {
    const docObj = useDoc();
    if (docObj?.metadata) {
      docMetadata = {
        title: docObj.metadata.title,
        permalink: docObj.metadata.permalink,
      };
    }
  } catch {
    // Gracefully handle pages outside DocProvider
  }

  const schema = generateBreadcrumbSchema({
    breadcrumbs: sidebarBreadcrumbs,
    siteUrl: siteConfig.url,
    baseUrl: siteConfig.baseUrl,
    docMetadata,
  });

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Head>
  );
}

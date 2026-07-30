/**
 * DocItem/Content wrapper — surfaces EstimatedTime from `time` frontmatter
 * (issue #307 / Phase 4), the page feedback widget (issue #359), and the
 * content recommendation engine (issue #341 / Phase 5).
 */

import React, { type ReactNode } from 'react';
import Content from '@theme-original/DocItem/Content';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { EstimatedTime, parseEstimatedTime } from '@site/src/components/PatternDoc';
import DocFeedback from '@site/src/components/DocFeedback';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof Content>;

export default function DocItemContentWrapper(props: Props): ReactNode {
  let metadata: { id: string } | undefined;
  let frontMatter: { time?: string | number } | undefined;

  try {
    const docObj = useDoc();
    metadata = docObj.metadata;
    frontMatter = docObj.frontMatter as { time?: string | number };
  } catch {
    metadata = undefined;
    frontMatter = undefined;
  }

  const rawTime = frontMatter?.time;
  const label = parseEstimatedTime(rawTime);

  return (
    <>
      {label && rawTime != null && rawTime !== '' ? (
        <div className={styles.estimatedTimeRow}>
          <EstimatedTime time={rawTime} />
        </div>
      ) : null}
      <Content {...props} />
      {metadata?.id ? (
        <BrowserOnly>
          {() => {
            const { RecommendationWidget } = require('../../../components/recommendations');
            return <RecommendationWidget currentDocId={metadata.id} />;
          }}
        </BrowserOnly>
      ) : null}
      <DocFeedback />
    </>
  );
}

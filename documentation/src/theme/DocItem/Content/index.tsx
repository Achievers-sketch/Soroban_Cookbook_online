/**
 * DocItem/Content wrapper — surfaces EstimatedTime from `time` frontmatter
 * (issue #307 / Phase 4) and the page feedback widget (issue #359).
 */

import React, { type ReactNode } from 'react';
import Content from '@theme-original/DocItem/Content';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { EstimatedTime, parseEstimatedTime } from '@site/src/components/PatternDoc';
import DocFeedback from '@site/src/components/DocFeedback';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof Content>;

export default function DocItemContentWrapper(props: Props): ReactNode {
  const { frontMatter } = useDoc();
  const rawTime = (frontMatter as { time?: string | number }).time;
  const label = parseEstimatedTime(rawTime);

  return (
    <>
      {label && rawTime != null && rawTime !== '' ? (
        <div className={styles.estimatedTimeRow}>
          <EstimatedTime time={rawTime} />
        </div>
      ) : null}
      <Content {...props} />
      <DocFeedback />
    </>
  );
}

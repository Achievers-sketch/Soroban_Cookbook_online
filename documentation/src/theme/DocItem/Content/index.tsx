/**
 * DocItem/Content wrapper — surfaces EstimatedTime from `time` frontmatter
 * (issue #307 / Phase 4), the TutorialProgress step bar from `steps`
 * frontmatter (issue #306 / Phase 4), and the page feedback widget
 * (issue #359).
 */

import React, { type ReactNode } from 'react';
import Content from '@theme-original/DocItem/Content';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { EstimatedTime, parseEstimatedTime } from '@site/src/components/PatternDoc';
import { TutorialProgress } from '@site/src/components/TutorialProgress';
import DocFeedback from '@site/src/components/DocFeedback';
import styles from './styles.module.css';

type Props = React.ComponentProps<typeof Content>;

export default function DocItemContentWrapper(props: Props): ReactNode {
  const { frontMatter } = useDoc();
  const rawTime = (frontMatter as { time?: string | number }).time;
  const label = parseEstimatedTime(rawTime);
  const steps = (frontMatter as { steps?: string[] }).steps;

  return (
    <>
      {label && rawTime != null && rawTime !== '' ? (
        <div className={styles.estimatedTimeRow}>
          <EstimatedTime time={rawTime} />
        </div>
      ) : null}
      {steps && steps.length > 0 ? <TutorialProgress steps={steps} /> : null}
      <Content {...props} />
      <DocFeedback />
    </>
  );
}

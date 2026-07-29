import React from 'react';
import { Skeleton } from './index';
import styles from './DocSkeleton.module.css';

export default function DocSkeleton() {
  return (
    <div className={styles.container}>
      <p className={styles.previewLabel}>[ISSUE #35 PREVIEW MODE]</p>

      {/* This will stay on screen so you can take the screenshot */}
      <Skeleton height="3rem" width="80%" />
      <div className={styles.skeletonGroup}>
        <Skeleton height="1.25rem" width="100%" />
        <Skeleton height="1.25rem" width="90%" />
        <Skeleton height="1.25rem" width="95%" />
        <Skeleton height="150px" width="100%" />
      </div>
    </div>
  );
}

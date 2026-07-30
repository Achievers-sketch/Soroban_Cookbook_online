import MDXComponents from '@theme-original/MDXComponents';
import { PatternCallout, PatternMeta, PatternSection } from '@site/src/components/PatternDoc';
import { CodeSnippet } from '@site/src/components/CodeSnippet';
import { PatternCustomizer } from '@site/src/components/PatternCustomizer';
import { VideoPlayer } from '@site/src/components/VideoPlayer';
import {
  PatternCallout,
  PatternMeta,
  PatternSection,
  EstimatedTime,
} from '@site/src/components/PatternDoc';
import CodeSnippet from '@site/src/components/CodeSnippet';
import Collapsible from '@site/src/components/Collapsible/Collapsible';

export default {
  ...MDXComponents,
  PatternMeta,
  PatternSection,
  PatternCallout,
  CodeSnippet,
  PatternCustomizer,
  VideoPlayer,
  EstimatedTime,
  CodeSnippet,
  Collapsible,
};

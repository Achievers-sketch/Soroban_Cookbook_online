import MDXComponents from '@theme-original/MDXComponents';
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
  EstimatedTime,
  CodeSnippet,
  Collapsible,
};

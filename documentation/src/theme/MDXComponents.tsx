import MDXComponents from '@theme-original/MDXComponents';
import {
  PatternCallout,
  PatternMeta,
  PatternSection,
  EstimatedTime,
} from '@site/src/components/PatternDoc';
import CodeSnippet from '@site/src/components/CodeSnippet';
import { Quiz } from '@site/src/components/Quiz';

export default {
  ...MDXComponents,
  PatternMeta,
  PatternSection,
  PatternCallout,
  EstimatedTime,
  CodeSnippet,
  Quiz,
};

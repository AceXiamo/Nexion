import 'react-i18next';

// Import the resources type from the actual resource file
import { resources } from './index';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources['en'];
  }
}
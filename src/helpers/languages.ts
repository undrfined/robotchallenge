import type { IconType } from '../components/common/Icon/Icon';

type Language = {
  name: string;
  icon: IconType;
  isDisabled?: boolean;
};

export const LANGUAGES: Record<string, Language> = {
  js: {
    name: 'JavaScript',
    icon: 'js',
    isDisabled: true,
  },
  rust: {
    name: 'Rust',
    icon: 'rust',
  },
  cpp: {
    name: 'C++',
    icon: 'cpp',
    isDisabled: true,
  },
  c: {
    name: 'C',
    icon: 'c',
    isDisabled: true,
  },
  csharp: {
    name: 'C#',
    icon: 'csharp',
  },
};

import type React from 'react';
import js from '../assets/icons/languages/js.svg';
import rust from '../assets/icons/languages/rust.svg';
import cpp from '../assets/icons/languages/cpp.svg';
import c from '../assets/icons/languages/c.svg';
import csharp from '../assets/icons/languages/csharp.svg';

type Language = {
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isDisabled?: boolean;
};

export const LANGUAGES: Record<string, Language> = {
  js: {
    name: 'JavaScript',
    icon: js,
    isDisabled: true,
  },
  rust: {
    name: 'Rust',
    icon: rust,
  },
  cpp: {
    name: 'C++',
    icon: cpp,
    isDisabled: true,
  },
  c: {
    name: 'C',
    icon: c,
    isDisabled: true,
  },
  csharp: {
    name: 'C#',
    icon: csharp,
  },
};

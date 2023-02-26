import type React from 'react';
import js from '../assets/icons/languages/js.svg';
import rust from '../assets/icons/languages/rust.svg';
import cpp from '../assets/icons/languages/cpp.svg';
import c from '../assets/icons/languages/c.svg';
import csharp from '../assets/icons/languages/csharp.svg';

export const LANGUAGE_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  js,
  rust,
  cpp,
  c,
  csharp,
};

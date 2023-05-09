import React from 'react';
import SvgUniqueId from '../../../helpers/svgUniqueId';

// ls -p src/assets/icons | grep -v / | grep ".*\.svg" | sed "s/\(.*\).svg/import \1 from '..\/..\/..\/assets\/icons\/\1.svg';/g" | pbcopy
import Back from '../../../assets/icons/Back.svg';
import Check from '../../../assets/icons/Check.svg';
import Close from '../../../assets/icons/Close.svg';
import Code from '../../../assets/icons/Code.svg';
import Dropdown from '../../../assets/icons/Dropdown.svg';
import EnergyIcon from '../../../assets/icons/EnergyIcon.svg';
import Github from '../../../assets/icons/Github.svg';
import Log from '../../../assets/icons/Log.svg';
import More from '../../../assets/icons/More.svg';
import NextRound from '../../../assets/icons/NextRound.svg';
import NextStep from '../../../assets/icons/NextStep.svg';
import Pause from '../../../assets/icons/Pause.svg';
import Play from '../../../assets/icons/Play.svg';
import RobotIcon from '../../../assets/icons/RobotIcon.svg';
import RoundIcon from '../../../assets/icons/RoundIcon.svg';
import Upload from '../../../assets/icons/Upload.svg';
import Version from '../../../assets/icons/Version.svg';
import c from '../../../assets/icons/c.svg';
import cpp from '../../../assets/icons/cpp.svg';
import csharp from '../../../assets/icons/csharp.svg';
import js from '../../../assets/icons/js.svg';
import rust from '../../../assets/icons/rust.svg';

// ls -p src/assets/icons | grep -v / | grep ".*\.svg" | sed "s/\(.*\).svg/\1,/g" | pbcopy
const icons = {
  Back,
  Check,
  Close,
  Code,
  Dropdown,
  EnergyIcon,
  Github,
  Log,
  More,
  NextRound,
  NextStep,
  Pause,
  Play,
  RobotIcon,
  RoundIcon,
  Upload,
  Version,
  c,
  cpp,
  csharp,
  js,
  rust,
};

export type IconType = keyof typeof icons;

type OwnProps = {
  name: IconType;
} & React.SVGProps<SVGSVGElement>;

export default function Icon({
  name,
  ...otherProps
}: OwnProps) {
  const IconImported = icons[name];

  return (
    <SvgUniqueId>
      {IconImported(otherProps)}
    </SvgUniqueId>
  );
}

import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBath,
  IconBed,
  IconBorderBottom,
  IconBorderTop,
  IconBulb,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDeviceDesktop,
  IconDoor,
  IconDownload,
  IconDroplet,
  IconInfoCircle,
  IconLayoutBoard,
  IconLayoutColumns,
  IconLayoutGrid,
  IconLink,
  IconMenu2,
  IconMinus,
  IconPaint,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconShare,
  IconSofa,
  IconSun,
  IconToolsKitchen2,
  IconTrash,
  IconUpload,
  IconWall,
  IconWallpaper,
  IconX,
} from '@tabler/icons-react';
import type { ComponentType, SVGProps } from 'react';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const Moon: IconComponent = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
  </svg>
);

const StepPointer: IconComponent = (props) => (
  <svg viewBox="0 0 16 11" fill="currentColor" {...props}>
    <path d="M0 0H16L8 11Z" />
  </svg>
);

export const icons = {
  sun: IconSun,
  moon: Moon,
  system: IconDeviceDesktop,
  check: IconCheck,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
  close: IconX,
  arrowLeft: IconArrowLeft,
  arrowRight: IconArrowRight,
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  menu: IconMenu2,
  stepPointer: StepPointer,
  plus: IconPlus,
  minus: IconMinus,
  edit: IconPencil,
  trash: IconTrash,
  copy: IconCopy,
  share: IconShare,
  download: IconDownload,
  refresh: IconRefresh,
  link: IconLink,
  upload: IconUpload,
  'room.livingRoom': IconSofa,
  'room.bedroom': IconBed,
  'room.kitchen': IconToolsKitchen2,
  'room.kitchenLiving': IconLayoutColumns,
  'room.bathroom': IconBath,
  'category.floorCovering': IconLayoutBoard,
  'category.wallPaint': IconPaint,
  'category.wallpaper': IconWallpaper,
  'category.wallTile': IconWall,
  'category.floorTile': IconLayoutGrid,
  'category.ceilingFinish': IconBorderTop,
  'category.skirtingBoards': IconBorderBottom,
  'category.doors': IconDoor,
  'category.lighting': IconBulb,
  'category.plumbingFixtures': IconDroplet,
} satisfies Record<string, IconComponent>;

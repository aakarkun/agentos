'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  Wallet01Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
  Settings01Icon,
  UserMultiple02Icon,
  Sent02Icon,
  RefreshIcon,
  Home01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

const size = 20;
const baseClassName = 'shrink-0';

interface IconProps {
  className?: string;
}

export function IconWallet({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Wallet01Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconBack({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={ArrowLeft01Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconAdd({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Add01Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconRemove({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Delete02Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconSettings({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Settings01Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconUsers({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={UserMultiple02Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconSend({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Sent02Icon} size={size} className={cn(baseClassName, className)} />;
}

export function IconRefresh({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={RefreshIcon} size={size} className={cn(baseClassName, className)} />;
}

export function IconHome({ className }: IconProps = {}) {
  return <HugeiconsIcon icon={Home01Icon} size={size} className={cn(baseClassName, className)} />;
}

import React from 'react';

type IconName =
  | 'bx-layout'
  | 'bx-bed'
  | 'bx-calendar-check'
  | 'bx-group'
  | 'bx-credit-card'
  | 'bx-coffee'
  | 'bx-log-out'
  | 'bx-log-in'
  | 'bx-bell'
  | 'bx-search'
  | 'bx-menu'
  | 'bx-x'
  | 'bx-plus'
  | 'bx-show'
  | 'bx-error-circle'
  | 'bx-error'
  | 'bx-dollar'
  | 'bx-trending-up'
  | 'bx-right-arrow-alt'
  | 'bx-down-arrow'
  | 'bx-time-five'
  | 'bx-wrench'
  | 'bx-star'
  | 'bx-check-circle'
  | 'bx-food-menu'
  | 'bx-car'
  | 'bx-edit'
  | 'bx-trash'
  | 'bx-user'
  | 'bx-x-circle'
  | 'bx-spa'
  | 'bx-check'
  | 'bx-dots-horizontal-rounded'
  | 'bx-bar-chart-square'
  | 'bx-envelope'
  | 'bx-lock-alt'
  | 'bx-hide'
  | 'bx-package'
  | 'bx-dry-clean'
  | 'bx-drink'
  | 'bx-category-alt'
  | 'bx-map';

interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  return <i className={`bx ${name} ${className}`} />;
}

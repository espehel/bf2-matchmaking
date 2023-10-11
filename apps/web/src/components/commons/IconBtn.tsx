import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';
import * as React from 'react';
import Link from 'next/link';
interface BaseProps {
  Icon: ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;
type LinkProps = RefAttributes<HTMLAnchorElement>;

type Props = ButtonProps | LinkProps;

export default function IconBtn({
  Icon,
  size = 'md',
  className,
  ...props
}: Props & BaseProps) {
  const classes = ['btn btn-ghost btn-square', `btn-${size}`, className || ''].join(' ');

  if (props.href) {
    return (
      <Link className={classes} {...(props as LinkProps & { href: string })}>
        <Icon />
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonProps)}>
      {<Icon />}
    </button>
  );
}

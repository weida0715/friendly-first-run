"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

function NavLink({ className, activeClassName, href, ...props }: NavLinkCompatProps) {
  const pathname = usePathname();
  const hrefValue = typeof href === "string" ? href : href?.toString();
  const isActive = hrefValue ? pathname === hrefValue : false;

  return (
    <Link href={href} className={cn(className, isActive && activeClassName)} {...props} />
  );
}

export { NavLink };

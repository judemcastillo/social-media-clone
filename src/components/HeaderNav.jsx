"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, Compass } from "lucide-react";
import { useUnread } from "@/components/providers/unread-context";

function NavItem({ href, icon: Icon, label, badgeCount = 0 }) {
	const pathname = usePathname();
	const active = pathname === href || pathname.startsWith(href + "/");
	const showBadge = badgeCount > 0;

	const base = "relative px-4 pb-1 text-muted-foreground  transition  ";
	const activeCls = active
		? "text-primary border-primary border-b-2 border-primary "
		: "hover:text-foreground hover:underline-foreground/30 border-b-2 border-b-transparent hover:border-muted-foreground";

	return (
		<Link
			href={href}
			aria-current={active ? "page" : undefined}
			className={`${base} ${activeCls}`}
		>
			<span className="relative inline-flex">
				<Icon className={`size-6 ${active ? "stroke-[2.5]" : ""}`} />
				{showBadge && (
					<span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[16px] flex items-center justify-center">
						{badgeCount > 99 ? "99+" : badgeCount}
					</span>
				)}
			</span>
			<span className="sr-only">{label}</span>
		</Link>
	);
}

export default function HeaderNav() {
	const { unreadTotal } = useUnread();

	return (
		<nav className="flex flex-row gap-5 translate-y-0.5">
			<NavItem href="/home" icon={Home} label="Home" />
			<NavItem
				href="/messages"
				icon={Mail}
				label="Messages"
				badgeCount={unreadTotal}
			/>
			<NavItem href="/discover" icon={Compass} label="Discover" />
		</nav>
	);
}

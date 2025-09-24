"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, Compass } from "lucide-react";

function NavItem({ href, icon: Icon, label }) {
	const pathname = usePathname();
	const active = pathname === href || pathname.startsWith(href + "/");

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
			<Icon className={`size-6 ${active ? "stroke-[2.5]" : ""}`} />
			<span className="sr-only">{label}</span>
		</Link>
	);
}

export default function HeaderNav() {
	return (
		<nav className="flex flex-row gap-5 translate-y-0.5">
			<NavItem href="/home" icon={Home} label="Home" />
			<NavItem href="/messages" icon={Mail} label="Messages" />
			<NavItem href="/discover" icon={Compass} label="Discover" />
		</nav>
	);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";

const NavItems = () => {
    const pathname = usePathname();

    const isActive = (path: string): boolean => {
        if (path === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(path);
    };

    return (
        <ul className="flex flex-col sm:flex-row gap-3 p-2 font-medium">
            {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                    <Link
                        href={item.href}
                        className={`transition-colors hover:text-green-500 ${
                            isActive(item.href) ? "text-gray-100" : "text-gray-400"
                        }`}
                    >
                        {item.label}
                    </Link>
                </li>
            ))}
        </ul>
    );
};

export default NavItems;

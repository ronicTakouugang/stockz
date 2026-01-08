"use client"
import React from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {LogOut} from "lucide-react";
import NavItems from "@/components/NavItems";
import { authClient } from "@/lib/better-auth/auth-client";

const UserDropDown = ({user}:{user:User}) => {
    const router = useRouter()

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/sign-in");
                },
            },
        });
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-3 text-gray-4 hover:text-green-500"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src="https://github.com/shadcn.png"
                                alt="@shadcn"
                            />
                            <AvatarFallback className="bg-green-500 text-green-900 text-sm font-bold">
                                {user.name?.[0] || user.email[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                        <span className="text-base font-medium text-gray-400">
                            {user.name || user.email}
                        </span>
                        </div>
                    </Button>
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="text-gray-400">
                <DropdownMenuLabel>
                    <div className="flex relative item-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src="https://github.com/shadcn.png"
                                alt="@shadcn"
                            />
                            <AvatarFallback className="bg-green-500 text-green-900 text-sm font-bold">
                                {user.name?.[0] || user.email[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                        <span className="text-base font-medium text-gray-400">
                            {user.name || user.email}
                        </span>
                            <span className="text-sm text-gray-500">
                            {user.email}
                        </span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600"/>
                <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:text-green-500 focus:bg-transaparent transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2 hidden sm:block  "/>
                    Sign Out
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-600 hidden sm:block"/>
                <nav className="sm:hidden">
                   <NavItems/>
                </nav>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserDropDown

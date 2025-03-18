"use client";

import { Button } from "@repo/ui/components/ui/button";
import {
  InputBase,
  InputBaseAdornment,
  InputBaseControl,
  InputBaseInput,
} from "@repo/ui/components/ui/input-base";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Bell, Plus, Search, User } from "lucide-react";
import Link from "next/link";

export default function DashboardHeader() {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Form Builder
        </h1>
        <p className="leading-7">Create and manage your forms</p>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <InputBase>
          <InputBaseAdornment>
            <Search />
          </InputBaseAdornment>
          <InputBaseControl>
            <InputBaseInput placeholder="Search..." className="outline-0" />
          </InputBaseControl>
        </InputBase>

        <Button variant="outline" size="icon">
          <Bell />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button asChild>
          <Link href="/form/builder" className="flex items-center gap-1 py-2">
            <Plus className="h-4 w-4" /> New Form
          </Link>
        </Button>
      </div>
    </header>
  );
}

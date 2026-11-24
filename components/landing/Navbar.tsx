"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LogoTextOnly from "../ui/LogoTextOnly";

export default function Navbar() {
  const router = useRouter();

  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const isLoggedIn = !!user;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        href="#how-it-works"
        className={`text-muted-foreground hover:text-foreground transition-colors ${
          mobile ? "text-lg py-2" : "text-sm"
        }`}
      >
        How It Works
      </Link>

      <Link
        href="#features"
        className={`text-muted-foreground hover:text-foreground transition-colors ${
          mobile ? "text-lg py-2" : "text-sm"
        }`}
      >
        Features
      </Link>

      <Link
        href="#pricing"
        className={`text-muted-foreground hover:text-foreground transition-colors ${
          mobile ? "text-lg py-2" : "text-sm"
        }`}
      >
        Pricing
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Logo & Desktop Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight z-50 text-foreground"
          >
            <Image
              src="/logo.png"
              alt="Arbiter Logo"
              width={32}
              height={32}
              className="w-8 h-8"
              priority
            />
            <LogoTextOnly />
          </Link>

          <div className="hidden md:flex gap-6 font-medium">
            <NavLinks />
          </div>
        </div>

        {/* Right Side: Desktop Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {isPending ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <Avatar className="h-10 w-10 border border-border hover:border-ring transition-colors">
                    <AvatarImage src={user?.image || ""} alt={user?.name} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>

                <Link href="/register">
                  <Button>Start Free</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger className="md:hidden -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-75 sm:w-100 flex flex-col pt-12 px-6 h-full bg-background"
              >
                <SheetHeader className="hidden">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Mobile User Profile */}
                {isLoggedIn && user && (
                  <div className="flex items-center gap-3 pb-6 mb-2 border-b border-border">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex flex-col gap-2 font-medium mt-4">
                  <NavLinks mobile={true} />
                </div>

                {/* Mobile Auth Actions */}
                <div className="mt-auto flex flex-col gap-4 pb-8">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-4 pt-4 border-t border-border">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-lg transition-colors"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground text-lg transition-colors"
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-destructive hover:opacity-80 text-left text-lg mt-2 transition-opacity"
                      >
                        <LogOut className="h-5 w-5" />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                      <Link href="/register" className="w-full">
                        <Button className="w-full h-12 text-base">
                          Start Free
                        </Button>
                      </Link>

                      <Link href="/login" className="w-full">
                        <Button
                          variant="outline"
                          className="w-full h-12 text-base"
                        >
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

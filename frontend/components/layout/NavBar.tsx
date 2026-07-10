"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search, Menu, Sun, Moon, User, Users, Heart, Settings, LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { title: "Home", href: "/" },
  { title: "Pokédex", href: "/pokedex" },
  { title: "Types", href: "/types" },
  { title: "Builder", href: "/builder" },
]

// swap for real auth state (session, JWT, etc.)
type User = { name: string; email: string } | null

export function Navbar({ user = null }: { user?: User }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = React.useState(false)
  const [dark, setDark] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur transition-shadow duration-200",
        scrolled ? "border-border shadow-sm" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <img src="/logo.png" className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
          <span className="text-lg font-semibold tracking-tight text-foreground uppercase">
            Poke<span className="text-primary">pedia</span>
          </span>
        </Link>

        {/* Desktop nav left actions */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-[2px] scale-x-0 rounded-full bg-primary transition-transform duration-200",
                    active && "scale-x-100"
                  )}
                />
              </Link>
            )
          })}
        </nav>

        {/* Search — desktop/tablet */}
        <div className="relative ml-auto hidden max-w-xs flex-1 items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="h-9 rounded-full bg-muted/40 pl-9 text-sm border border-foreground"
          />
        </div>

        {/* Right actions */}
        <div className={cn("flex items-center gap-2", "sm:ml-0", !user && "ml-auto sm:ml-0")}>
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex hover:cursor-pointer"
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile"><User className="h-4 w-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/teams"><Users className="h-4 w-4" /> My Teams</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites"><Heart className="h-4 w-4" /> Favorites</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" className="rounded-md p-4" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="rounded-md p-4" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px]">
              <div className="mt-8 flex flex-col gap-1">
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="search" placeholder="Search Pokémon..." className="h-10 rounded-full bg-muted/40 pl-9" />
                </div>

                {navItems.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                      )}
                    >
                      {item.title}
                    </Link>
                  )
                })}

                <div className="my-2 h-px bg-border" />

                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><User className="h-4 w-4" /> Profile</Link>
                    <Link href="/teams" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><Users className="h-4 w-4" /> My Teams</Link>
                    <Link href="/favorites" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><Heart className="h-4 w-4" /> Favorites</Link>
                    <Link href="/settings" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><Settings className="h-4 w-4" /> Settings</Link>
                    <button className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-1 pt-1">
                    <Button variant="outline" asChild><Link href="/login">Sign in</Link></Button>
                    <Button className="rounded-full" asChild><Link href="/signup">Sign up</Link></Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
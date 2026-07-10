import Link from "next/link";
import { orbitron } from "@/lib/font";
import { Undo2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-12">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/ball_bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-background/40" />

      {/* art panel */}
      <div className="relative col-span-7 hidden overflow-hidden lg:block rounded-2xl">
        <img
          src="/auth_bg.png"
          alt="Auth Background Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/10 via-black/10 to-transparent" />

        {/* Slogan */}
        <div className="absolute bottom-0 left-0 w-full p-4">
          <div className="rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-[2px]">
            <h2 className={`${orbitron.className} mt-3 text-4xl font-bold leading-tight text-white uppercase`}>
              ultimate pokedex
            </h2>

            <p className="mt-4 text-lg leading-7 text-white/80 font-bold">
              Create your dream team, analyze any Pokemon,
              discover perfect partners, and prepare for every battle with AI-powered
              insights.
            </p>
          </div>
        </div>
      </div>

      {/* form panel */}
      <div className="col-span-5 flex min-h-screen flex-col px-6 py-8 lg:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="PokePedia"
              className="h-12 w-12"
            />

            <h1 className="text-2xl font-extrabold uppercase">
              <span className="text-black">Poke</span>
              <span className="text-primary">Pedia</span>
            </h1>
          </Link>

          {/* Back Button */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-black bg-background/70 px-4 py-2 shadow-sm 
            backdrop-blur transition-all duration-500 hover:bg-primary hover:text-primary-foreground"
          >
            <Undo2 className="h-6 w-6" />
          </Link>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
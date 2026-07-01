import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen p-3 lg:grid-cols-4">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/ball_bg.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-background/40" />

      {/* Left: art panel */}
      <div className="relative col-span-2 hidden overflow-hidden rounded-2xl lg:block">
        <img
          src="/auth_bg.png"
          alt="Auth Background Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        {/* top row: logo + back link */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-8">
          <span className="text-xl font-bold tracking-tight text-white">Pokepedia</span>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-black bg-white/25 px-4 py-2 text-sm font-medium text-white backdrop-blur-md shadow-sm hover:bg-white/35"
          >
            Back to home
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* bottom: tagline*/}
        <div className="absolute inset-x-0 bottom-0 space-y-6 p-8">
          <p className="text-3xl font-semibold text-white">
            The Ultimate Pokedex,
            <br />
            Build your dream team.
          </p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="col-span-2 flex items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
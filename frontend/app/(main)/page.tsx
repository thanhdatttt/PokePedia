import { Navbar } from "@/components/layout/NavBar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        Welcome to PokePedia
      </main>
    </>
  );
}
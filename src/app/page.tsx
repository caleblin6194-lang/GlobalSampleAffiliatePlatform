import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold tracking-tight">KOLINK</div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            The Next Generation
            <br />
            <span className="text-primary">Creator Commerce</span> Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Connect with top creators, launch products, and grow your brand in the 3C
            数码 accessories space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=creator">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Test
              </Button>
            </Link>
            <Link href="/register?role=creator">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as Creator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Path</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Creator Card */}
            <div className="rounded-xl border bg-card/80 backdrop-blur p-6 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Creator</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Get free samples, create content, and earn commissions
              </p>
              <Link href="/register?role=creator" className="block">
                <Button variant="outline" className="w-full">
                  Join as Creator
                </Button>
              </Link>
            </div>

            {/* Merchant Card */}
            <div className="rounded-xl border bg-card/80 backdrop-blur p-6 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Merchant</h3>
              <p className="text-muted-foreground text-sm mb-4">
                List products, recruit creators, and grow your business
              </p>
              <Link href="/register?role=merchant" className="block">
                <Button variant="outline" className="w-full">
                  Merchant Join
                </Button>
              </Link>
            </div>

            {/* Buyer Card */}
            <div className="rounded-xl border bg-card/80 backdrop-blur p-6 hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Buyer</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Use links and coupons to resell and earn commissions
              </p>
              <Link href="/register?role=buyer" className="block">
                <Button variant="outline" className="w-full">
                  Join as Buyer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 Kolink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

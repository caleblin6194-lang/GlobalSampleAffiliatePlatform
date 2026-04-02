import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F111A' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,17,26,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>KOLINK</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#9D4EDD', color: '#fff' }}>EXPERTS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" style={{ backgroundColor: '#FF006E', color: '#fff' }}>
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" style={{ color: '#FFFFFF', lineHeight: 1.1 }}>
            <span style={{ color: '#9D4EDD' }}>Creator</span> Commerce
            <br />
            Platform
          </h1>
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Connect with top creators, launch products, and grow your brand in the 3C数码 accessories space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=creator">
              <Button size="lg" className="w-full sm:w-auto" style={{ backgroundColor: '#FF006E', color: '#fff' }}>
                Start Free Trial
              </Button>
            </Link>
            <Link href="/choose-role">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10" style={{ backgroundColor: 'transparent' }}>
                Join as Creator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#1A1A2E' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#FFFFFF' }}>
            Choose Your Path
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Creator Card */}
            <div className="rounded-lg p-6 border transition-all hover:scale-105 cursor-pointer" style={{ backgroundColor: '#0F111A', borderColor: '#9D4EDD' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(157,78,221,0.2)' }}>
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>Creator</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Get free samples, create content, and earn commissions
              </p>
              <Link href="/register?role=creator" className="block">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" style={{ backgroundColor: 'transparent' }}>
                  Join as Creator
                </Button>
              </Link>
            </div>

            {/* Merchant Card */}
            <div className="rounded-lg p-6 border transition-all hover:scale-105 cursor-pointer" style={{ backgroundColor: '#0F111A', borderColor: '#00D9FF' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,217,255,0.2)' }}>
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>Merchant</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                List products, recruit creators, and grow your business
              </p>
              <Link href="/register?role=merchant" className="block">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" style={{ backgroundColor: 'transparent' }}>
                  Merchant Join
                </Button>
              </Link>
            </div>

            {/* Buyer Card */}
            <div className="rounded-lg p-6 border transition-all hover:scale-105 cursor-pointer" style={{ backgroundColor: '#0F111A', borderColor: '#00F5D4' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,245,212,0.2)' }}>
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>Buyer</h3>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Use links and coupons to resell and earn commissions
              </p>
              <Link href="/register?role=buyer" className="block">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" style={{ backgroundColor: 'transparent' }}>
                  Join as Buyer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#0F111A' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#FFFFFF' }}>
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#9D4EDD' }}>
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#FFFFFF' }}>Get Products</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Apply for free samples from brands looking for creators
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FF006E' }}>
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#FFFFFF' }}>Create Content</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Share authentic reviews on TikTok, Instagram, or YouTube
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#00D9FF' }}>
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#FFFFFF' }}>Earn Commission</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Get paid for every sale made through your unique link
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2024 Kolink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

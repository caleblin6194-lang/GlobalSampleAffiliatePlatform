import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ChooseRolePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select how you want to join Kolink
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Creator */}
          <Link href="/register?role=creator" className="block">
            <Card className="h-full bg-card/80 backdrop-blur border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">I&apos;m a Creator</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get free samples, create content, earn commissions
                </p>
                <Button variant="outline" className="w-full">
                  Start Creating
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Merchant */}
          <Link href="/register?role=merchant" className="block">
            <Card className="h-full bg-card/80 backdrop-blur border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🏪</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">I&apos;m a Merchant</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  List products, recruit creators, get orders
                </p>
                <Button variant="outline" className="w-full">
                  Start Selling
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Buyer */}
          <Link href="/register?role=buyer" className="block">
            <Card className="h-full bg-card/80 backdrop-blur border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🛒</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">I&apos;m a Buyer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use links and coupons to resell in your network
                </p>
                <Button variant="outline" className="w-full">
                  Start Selling
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

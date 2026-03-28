import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Global Sample Affiliate Platform
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Connect Brands with Creators
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            The platform where brands offer product samples, creators produce content,
            and vendors supply the products — all in one ecosystem.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { role: 'admin', label: 'Administrator', desc: 'Platform management and oversight', color: 'text-red-500' },
            { role: 'merchant', label: 'Brand Merchant', desc: 'Manage brands, products, and campaigns', color: 'text-blue-500' },
            { role: 'creator', label: 'Content Creator', desc: 'Discover campaigns and request samples', color: 'text-purple-500' },
            { role: 'vendor', label: 'Supplier Vendor', desc: 'Manage inventory and fulfill orders', color: 'text-green-500' },
          ].map(({ role, label, desc, color }) => (
            <div key={role} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className={`text-2xl font-bold ${color}`}>{label}</div>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

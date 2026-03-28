export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">GSAP</h1>
          <p className="text-sm text-muted-foreground mt-1">Global Sample Affiliate Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}

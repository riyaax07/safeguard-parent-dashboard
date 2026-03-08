import { Shield, Globe, Bell, Ban } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card flex-col justify-center px-12 xl:px-20">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold font-heading text-foreground">SafeGuard</span>
        </div>
        <p className="text-xl text-foreground/80 font-heading mb-10 leading-relaxed">
          Real-time protection for your children online
        </p>
        <div className="space-y-5">
          {[
            { icon: Globe, text: "Monitor every website your child visits in real-time" },
            { icon: Ban, text: "Instantly block harmful domains with one click" },
            { icon: Bell, text: "Receive alerts when suspicious content is detected" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground pt-1">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

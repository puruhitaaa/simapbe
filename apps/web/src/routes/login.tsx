import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link className="flex items-center gap-2" to="/">
          <Building2 className="h-8 w-8" />
          <span className="font-bold text-xl">SIMAPBE</span>
        </Link>
        <div>
          <h2 className="mb-4 font-bold text-4xl leading-tight">
            Sistem Manajemen Arsitektur SPBE Kota Bandung
          </h2>
          <p className="text-lg opacity-90">
            Platform terintegrasi untuk pengelolaan proses bisnis, data,
            aplikasi, infrastruktur, keamanan, dan layanan SPBE.
          </p>
        </div>
        <div className="text-sm opacity-70">
          &copy; {new Date().getFullYear()} Diskominfo Kota Bandung
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

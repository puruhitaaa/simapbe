"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link className="flex items-center gap-2" href="/">
          <Building2 className="h-8 w-8" />
          <span className="font-bold text-xl">SIMAPBE</span>
        </Link>
        <div>
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Keterpaduan Arsitektur SPBE untuk Tata Kelola Pemerintahan yang
              Efektif dan Efisien"
            </p>
            <footer className="text-sm opacity-80">— Perpres 132/2022</footer>
          </blockquote>
        </div>
        <p className="text-sm opacity-80">© 2025 Pemerintah Kota Bandung</p>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile header */}
          <div className="mb-8 text-center lg:hidden">
            <Link
              className="inline-flex items-center gap-2 text-primary"
              href="/"
            >
              <Building2 className="h-8 w-8" />
              <span className="font-bold text-xl">SIMAPBE</span>
            </Link>
          </div>

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

"use client";

import Link from "next/link";
import { login } from "@/app/auth-actions";
import { Bot, ArrowRight, AlertCircle, Building, User, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const type = searchParams.get("type");
  
  const [loginType, setLoginType] = useState<"admin" | "employee">(type === "admin" ? "admin" : "employee");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 selection:bg-[#E5E7EB] selection:text-[#111827]">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F172A] shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#111827]">
          NexaHR <span className="text-[#6B7280]">AI</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#F1F5F9] rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-[#111827] mb-2 tracking-tight">Welcome back</h1>
            <p className="text-sm text-[#6B7280] mb-6">
              Sign in to your account to continue to NexaHR AI.
            </p>

            {/* Role Toggle */}
            <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => setLoginType("employee")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                  loginType === "employee" 
                    ? "bg-white text-[#111827] shadow-sm" 
                    : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                <User className="w-4 h-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => setLoginType("admin")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all",
                  loginType === "admin" 
                    ? "bg-white text-[#111827] shadow-sm" 
                    : "text-[#6B7280] hover:text-[#111827]"
                )}
              >
                <Building className="w-4 h-4" />
                Company Admin
              </button>
            </div>

            {message && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#111827]" htmlFor="email">
                  Work Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <input type="hidden" name="loginType" value={loginType} />

              <button
                formAction={login}
                className="w-full bg-[#111827] text-white hover:bg-[#1f2937] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] rounded-xl px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 group mt-2"
              >
                Sign In {loginType === "admin" ? "as Admin" : "as Employee"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-8">
          Don't have an account?{" "}
          {loginType === "admin" ? (
            <Link href="/signup" className="text-[#111827] font-semibold hover:underline">
              Register your company
            </Link>
          ) : (
            <Link href="/signup/employee" className="text-[#111827] font-semibold hover:underline">
              Create employee account
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

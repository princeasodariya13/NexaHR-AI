"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    
    startTransition(async () => {
      const supabase = createClient();
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 selection:bg-[#E5E7EB] selection:text-[#111827]">
      <div className="absolute top-8 left-8 flex items-center gap-2 group">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0F172A] shadow-sm">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[#111827]">
          NexaHR <span className="text-[#6B7280]">AI</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#F1F5F9] rounded-full blur-[40px] pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-[#111827] mb-2 tracking-tight">Set Your Password</h1>
            <p className="text-sm text-[#6B7280] mb-8">
              Welcome to the team! Please set a secure password for your new employee account.
            </p>

            {success ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl mb-6 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>Password updated successfully! Redirecting you to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#111827]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                    />
                    <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#111827]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                    />
                    <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full bg-[#111827] text-white hover:bg-[#1f2937] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] rounded-xl px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-70"
                >
                  {isPending ? "Updating..." : "Save Password & Login"}
                  {!isPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Bell, Search, User, Sun, Moon } from "lucide-react";
import { logout } from "@/app/auth-actions";

export function TopNavbar({ 
  userEmail, 
  role = "EMPLOYEE" 
}: { 
  userEmail: string; 
  role?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Human readable role
  const formattedRole = role === "SUPER_ADMIN" 
    ? "Company Admin" 
    : role === "COMPANY_ADMIN" 
    ? "Company Admin" 
    : role === "HR_MANAGER" 
    ? "HR Manager" 
    : "Employee";

  return (
    <header className="h-16 bg-white dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-[#1E293B] flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-200">
      
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input 
          type="text"
          placeholder="Search employees, documents, or actions..."
          className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-lg text-sm text-[#111827] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] rounded-full transition-all duration-200"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-[#475569]" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400" />
          )}
        </button>

        <button className="relative p-2 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]"></span>
        </button>
        
        <div className="h-8 w-px bg-[#E5E7EB] dark:bg-[#1E293B] mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">{formattedRole}</span>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">{userEmail}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#111827] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center text-white dark:text-[#F3F4F6] cursor-pointer hover:ring-2 hover:ring-[#E5E7EB] dark:hover:ring-[#334155] transition-all">
            <User className="w-4 h-4" />
          </div>
          <form action={logout}>
            <button className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Logout</button>
          </form>
        </div>
      </div>
    </header>
  );
}

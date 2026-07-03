"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2, UserPlus, Mail, Key } from "lucide-react";
import { createEmployee } from "./actions";

export function AddEmployeeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    passwordOption: "auto" as "auto" | "manual",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.jobTitle) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (formData.passwordOption === 'manual' && formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...formData,
        loginUrl: window.location.origin + '/login'
      };

      const res = await createEmployee(payload);
      if (res.error) {
        if (res.error === "DEMO_MODE_OFFLINE") {
          alert("Success! (Demo Mode): Your database is currently paused, so the employee cannot be permanently saved to the table. Please unpause Supabase to see real data updates.");
          setIsOpen(false);
          setFormData({ firstName: "", lastName: "", email: "", jobTitle: "", passwordOption: "auto", password: "" });
        } else {
          alert(res.error);
        }
      } else {
        if (formData.passwordOption === 'auto') {
          if (res.emailSent) {
             alert(`Employee added successfully! An email has been sent to them.\n\nTheir temporary password is: ${res.generatedPassword}`);
          } else {
             alert(`Employee added successfully, but email sending failed.\n\nTheir temporary password is: ${res.generatedPassword}`);
          }
        } else {
            alert(`Employee added successfully!`);
        }
        setIsOpen(false);
        setFormData({ firstName: "", lastName: "", email: "", jobTitle: "", passwordOption: "auto", password: "" });
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#111827] dark:bg-[#F3F4F6] text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#E5E7EB] shadow-sm rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Employee
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827] dark:bg-[#F3F4F6]/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E7EB] dark:border-[#1E293B] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1E293B] flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#111827] dark:text-[#F3F4F6]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827] dark:text-[#F3F4F6]">Add New Employee</h3>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Register a new team member to the platform.</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#111827] dark:text-[#F3F4F6] transition-colors p-2 hover:bg-[#F3F4F6] dark:bg-[#1E293B] dark:hover:bg-[#1E293B]/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">First Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. John"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-[#111827] dark:text-[#F3F4F6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">Last Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Doe"
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-[#111827] dark:text-[#F3F4F6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">Work Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john.doe@company.com"
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-[#111827] dark:text-[#F3F4F6]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">Job Title <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all appearance-none cursor-pointer text-[#111827] dark:text-[#F3F4F6]"
                >
                  <option value="" disabled>Select a role...</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Senior Software Engineer">Senior Software Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Marketing Specialist">Marketing Specialist</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Operations Lead">Operations Lead</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Customer Support">Customer Support</option>
                </select>
              </div>

              {/* Password Options */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-[#111827] dark:text-[#F3F4F6]">Password Setup <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setFormData({...formData, passwordOption: 'auto'})}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.passwordOption === 'auto' 
                      ? "border-[#111827] dark:border-[#F3F4F6] bg-blue-50 dark:bg-blue-900/20" 
                      : "border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50"
                    }`}
                  >
                    <Mail className={`w-5 h-5 ${formData.passwordOption === 'auto' ? "text-[#111827] dark:text-[#F3F4F6]" : "text-[#9CA3AF] dark:text-[#6B7280]"}`} />
                    <span className={`text-sm font-medium ${formData.passwordOption === 'auto' ? "text-[#111827] dark:text-[#F3F4F6]" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>Auto-generate & Email</span>
                  </div>
                  
                  <div 
                    onClick={() => setFormData({...formData, passwordOption: 'manual'})}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.passwordOption === 'manual' 
                      ? "border-[#111827] dark:border-[#F3F4F6] bg-blue-50 dark:bg-blue-900/20" 
                      : "border-[#E5E7EB] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50"
                    }`}
                  >
                    <Key className={`w-5 h-5 ${formData.passwordOption === 'manual' ? "text-[#111827] dark:text-[#F3F4F6]" : "text-[#9CA3AF] dark:text-[#6B7280]"}`} />
                    <span className={`text-sm font-medium ${formData.passwordOption === 'manual' ? "text-[#111827] dark:text-[#F3F4F6]" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>Set Manually</span>
                  </div>
                </div>

                {formData.passwordOption === 'manual' && (
                  <div className="space-y-1 mt-2 animate-in fade-in slide-in-from-top-1">
                    <input 
                      type="text" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter temporary password"
                      className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]/20 focus:border-[#111827] transition-all text-[#111827] dark:text-[#F3F4F6]"
                    />
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">Must be at least 6 characters. You will need to share this with the employee.</p>
                  </div>
                )}
              </div>
            </form>
            
            <div className="p-6 border-t border-[#E5E7EB] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#1E293B] flex justify-end gap-3 mt-auto">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-[#475569] dark:text-[#9CA3AF] bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]/50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white dark:text-[#111827] bg-[#111827] dark:bg-[#F3F4F6] rounded-xl hover:bg-[#1f2937] dark:hover:bg-[#E5E7EB] transition-all shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Register Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

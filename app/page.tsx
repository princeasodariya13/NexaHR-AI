import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { AIAssistantSection } from "@/components/landing/AIAssistantSection";
import { AnalyticsSection } from "@/components/landing/AnalyticsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans selection:bg-[#E5E7EB] selection:text-[#111827]">
      {/* Dynamic background gradients - Light theme */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#F8FAFC] blur-[100px]" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#F1F5F9] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#F8FAFC] blur-[120px]" />
      </div>

      <Navbar />
      
      <main>
        <Hero />
        <TrustedBy />
        <ProblemSection />
        <SolutionSection />
        <FeatureSection />
        <AIAssistantSection />
        <AnalyticsSection />
        <PricingSection />
        <Testimonials />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

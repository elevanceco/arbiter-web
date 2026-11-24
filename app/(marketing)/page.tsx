import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
// import QuotationShowcase from "@/components/landing/QuotationShowcase";
import ResultsShowcase from "@/components/landing/ResultsShowcase";
import ByovSection from "@/components/landing/ByovSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
      <main>
        <HeroSection />
        <ProblemSection />
        <WorkflowSection />
        <FeaturesSection />
        {/* <QuotationShowcase /> */}
        <ResultsShowcase />
        <ByovSection />
        <ComparisonSection />
        <PricingSection />
        <FaqSection />
      </main>
    </div>
  );
}

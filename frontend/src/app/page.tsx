import type { Metadata } from "next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Hero } from "@/components/landing/Hero";
import { WhyNow } from "@/components/landing/WhyNow";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TheNumbers } from "@/components/landing/TheNumbers";
import { StillYou } from "@/components/landing/StillYou";
import { ChooseTogether } from "@/components/landing/ChooseTogether";
import { KeptPrivate } from "@/components/landing/KeptPrivate";
import { ClosingInvite, LandingFooter } from "@/components/landing/LandingFooter";
import { WakingToast } from "@/components/landing/WakingToast";
import { WarmUp } from "@/components/landing/OpenStudio";

export const metadata: Metadata = {
  title: { absolute: "Bloom — try your next hair before you need it" },
};

export default function Landing() {
  return (
    <>
      <WarmUp />
      <LandingHeader />
      <main>
        <Hero />
        <WhyNow />
        <TheNumbers />
        <HowItWorks />
        <StillYou />
        <ChooseTogether />
        <KeptPrivate />
        <ClosingInvite />
      </main>
      <LandingFooter />
      <WakingToast />
    </>
  );
}

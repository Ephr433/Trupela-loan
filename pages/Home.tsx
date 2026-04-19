import Hero from '../sections/Hero';
import StatsBar from '../sections/StatsBar';
import LoanProducts from '../sections/LoanProducts';
import LoanCalculator from '../sections/LoanCalculator';
import HowItWorks from '../sections/HowItWorks';
import TrustSecurity from '../sections/TrustSecurity';
import Testimonials from '../sections/Testimonials';
import Eligibility from '../sections/Eligibility';
import CTABanner from '../sections/CTABanner';

export default function Home() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <LoanProducts />
      <LoanCalculator />
      <HowItWorks />
      <TrustSecurity />
      <Testimonials />
      <Eligibility />
      <CTABanner />
    </main>
  );
}


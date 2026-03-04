import mangroveVideo from "@/assets/videos/mangrove.mp4";
import seagrassVideo from "@/assets/videos/seagrass.mp4";
import saltmarshVideo from "@/assets/videos/saltmarsh.mp4";
import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import gisAnimation from "../assets/lottie/gis.json";
import registryAnimation from "../assets/lottie/registry.json";
import visibilityAnimation from "../assets/lottie/visibility.json";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, Leaf, Upload, Shield, Link2, Eye } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import mangroveHero from '@assets/stock_images/mangrove_trees_in_wa_df0d8991.jpg';
import mangroveEcosystem from '@assets/stock_images/mangrove_forest_unde_2f49118f.jpg';
import saltMarsh from '@assets/stock_images/salt_marsh_wetland_c_09b253ba.jpg';
function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false); // 👈 THIS makes it reset
        }
      },
      { threshold: 0.4 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return { ref, visible };
}
function useSlide(direction: "left" | "right") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return {
    ref,
    className: `transition-all duration-700 ease-out ${visible
      ? "opacity-100 translate-x-0"
      : direction === "left"
        ? "opacity-0 -translate-x-8"
        : "opacity-0 translate-x-8"
      }`,
  };
}
export default function Landing() {
  const [, setLocation] = useLocation();
  const [activeEco, setActiveEco] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const step1 = useSlide("left");
  const step2 = useSlide("right");
  const step3 = useSlide("left");
  const step4 = useSlide("right");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background Image - Mangrove */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/0" />

        {/* video background*/}


        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-5xl mx-auto text-center text-white space-y-10">
            {/* Logo and Title */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Waves className="w-8 h-8 text-[#00A896]" />
                </div>
                <Leaf className="w-10 h-10 text-[#00A896]" />
              </div>
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight drop-shadow-xl">
                Nevara
              </h1>
            </div>

            {/* Subtitle */}
            <h2 className="text-xl md:text-2xl text-white/90 font-medium">
              GIS-verified coastal restoration intelligence.
            </h2>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <Button
                size="lg"
                className="bg-transparent border border-white/60 text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                onClick={() => setLocation('/login')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section id="why" className="py-24 bg-background text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">
            Why Nevara
          </h2>

          <p className="text-lg text-muted-foreground mb-12">
            Trust in restoration starts with clarity.
          </p>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="text-center space-y-4 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <Lottie
                animationData={gisAnimation}
                loop
                className="w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold">GIS Validation</h3>
              <p className="text-muted-foreground">
                Project boundaries verified through geospatial intelligence.
              </p>
            </div>

            <div className="text-center space-y-4 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <Lottie
                animationData={registryAnimation}
                loop
                className="w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold">Structured Registry</h3>
              <p className="text-muted-foreground">
                Standardized documentation for every restoration effort.
              </p>
            </div>

            <div className="text-center space-y-4 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <Lottie
                animationData={visibilityAnimation}
                loop
                className="w-32 h-32 mx-auto"
              />
              <h3 className="text-xl font-semibold">Public Visibility</h3>
              <p className="text-muted-foreground">
                Open access to project information and impact.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Project Lifecycle - Dark Mode */}
      <section className="relative bg-[#021d26] py-40 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-32">
            <h2 className="text-5xl font-semibold tracking-tight mb-6">
              Project Lifecycle
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              A transparent pathway from restoration registration to verified retirement.
            </p>
          </div>

          {/* Vertical Line */}
          <div className="absolute left-1/2 top-48 bottom-24 w-px bg-white/10 hidden md:block"></div>

          {/* Step 1 */}
          <div
            ref={step1.ref}
            className={`${step1.className} relative grid md:grid-cols-2 gap-16 items-center mb-32`}
          >
            <div className="text-right pr-12">
              <span className="text-6xl font-bold text-[#00A896]/20">01</span>

              <h3 className="text-3xl font-semibold mt-4">
                Register & Map
              </h3>

              <p className="text-white/70 mt-4">
                Projects are formally registered and mapped using verified geospatial boundaries.
              </p>

              <button
                onClick={() => setActiveStep(activeStep === 1 ? null : 1)}
                className="mt-6 text-sm text-[#00A896] hover:underline"
              >
                Learn more →
              </button>

              {activeStep === 1 && (
                <div className="mt-6 p-6 rounded-xl bg-[#032c38] text-white/70 transition-all duration-500">
                  Boundaries are defined through GIS polygon verification and
                  baseline ecological documentation before monitoring begins.
                </div>
              )}
            </div>

            <div></div>
          </div>

          {/* Step 2 */}
          <div
            ref={step2.ref}
            className={`${step2.className} relative grid md:grid-cols-2 gap-16 items-center mb-32`}
          >
            <div></div>

            <div className="text-left pl-12">
              <span className="text-6xl font-bold text-[#00A896]/20">02</span>

              <h3 className="text-3xl font-semibold mt-4">
                Monitor & Validate
              </h3>

              <p className="text-white/70 mt-4">
                Satellite monitoring and independent review assess ecological performance.
              </p>

              <button
                onClick={() => setActiveStep(activeStep === 2 ? null : 2)}
                className="mt-6 text-sm text-[#00A896] hover:underline"
              >
                Learn more →
              </button>

              {activeStep === 2 && (
                <div className="mt-6 p-6 rounded-xl bg-[#032c38] text-white/70 transition-all duration-500">
                  Continuous remote sensing and expert review confirm measurable
                  carbon sequestration outcomes.
                </div>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div
            ref={step3.ref}
            className={`${step3.className} relative grid md:grid-cols-2 gap-16 items-center mb-32`}
          >
            <div className="text-right pr-12">
              <span className="text-6xl font-bold text-[#00A896]/20">03</span>

              <h3 className="text-3xl font-semibold mt-4">
                Issue Verified Credits
              </h3>

              <p className="text-white/70 mt-4">
                Verified impact is converted into traceable carbon units.
              </p>

              <button
                onClick={() => setActiveStep(activeStep === 3 ? null : 3)}
                className="mt-6 text-sm text-[#00A896] hover:underline"
              >
                Learn more →
              </button>

              {activeStep === 3 && (
                <div className="mt-6 p-6 rounded-xl bg-[#032c38] text-white/70 transition-all duration-500">
                  Verified results are tokenized within a structured registry
                  framework ensuring traceability and transparency.
                </div>
              )}
            </div>

            <div></div>
          </div>

          {/* Step 4 */}
          <div
            ref={step4.ref}
            className={`${step4.className} text-center max-w-3xl mx-auto`}
          >
            <span className="text-6xl font-bold text-[#00A896]/20">04</span>

            <h3 className="text-3xl font-semibold mt-4">
              Credit Retirement
            </h3>

            <p className="text-white/70 mt-4">
              Purchased credits are permanently retired preventing double counting.
            </p>

            <button
              onClick={() => setActiveStep(activeStep === 4 ? null : 4)}
              className="mt-6 text-sm text-[#00A896] hover:underline"
            >
              Learn more →
            </button>

            {activeStep === 4 && (
              <div className="mt-6 p-6 rounded-xl bg-[#032c38] text-white/70 transition-all duration-500">
                Retirement records are permanently stored ensuring credits
                cannot be reused or reissued.
              </div>
            )}
          </div>
        </div>
      </section >

      {/* Blue Carbon Ecosystems */}
      < section className="py-32 bg-[#021d26]" >
        <div className="container mx-auto px-6">

          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Blue Carbon Ecosystems
            </h2>
            <p className="text-xl text-white/70">
              Click an ecosystem to reveal its carbon power
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">

            {/* Mangrove */}
            <div
              onClick={() => setActiveEco("mangrove")}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ${activeEco === "mangrove"
                ? "scale-105 ring-2 ring-[#00A896]"
                : "opacity-80 hover:opacity-100"
                }`}
            >
              <video
                src={mangroveVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white">
                  Mangroves
                </h3>
              </div>
            </div>

            {/* Seagrass */}
            <div
              onClick={() => setActiveEco("seagrass")}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ${activeEco === "seagrass"
                ? "scale-105 ring-2 ring-[#00A896]"
                : "opacity-80 hover:opacity-100"
                }`}
            >
              <video
                src={seagrassVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white">
                  Seagrass Meadows
                </h3>
              </div>
            </div>

            {/* Saltmarsh */}
            <div
              onClick={() => setActiveEco("saltmarsh")}
              className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ${activeEco === "saltmarsh"
                ? "scale-105 ring-2 ring-[#00A896]"
                : "opacity-80 hover:opacity-100"
                }`}
            >
              <video
                src={saltmarshVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white">
                  Salt Marshes
                </h3>
              </div>
            </div>

          </div>

          {/* Info Reveal */}
          {activeEco && (
            <div className="mt-20 text-center text-white max-w-3xl mx-auto transition-all duration-500">
              {activeEco === "mangrove" && (
                <>
                  <h4 className="text-4xl font-bold mb-4">Mangroves</h4>
                  <p className="text-lg text-white/80">
                    Store over 1,000 tons of carbon per hectare — up to 10x more than terrestrial forests.
                  </p>
                </>
              )}

              {activeEco === "seagrass" && (
                <>
                  <h4 className="text-4xl font-bold mb-4">Seagrass Meadows</h4>
                  <p className="text-lg text-white/80">
                    Capture carbon 35x faster than rainforests and store it in ocean sediments.
                  </p>
                </>
              )}

              {activeEco === "saltmarsh" && (
                <>
                  <h4 className="text-4xl font-bold mb-4">Salt Marshes</h4>
                  <p className="text-lg text-white/80">
                    Lock carbon deep into tidal soils for centuries while protecting coastlines.
                  </p>
                </>
              )}
            </div>
          )}

        </div>
      </section >
      {/* Final Section */}
      < section className="py-24 bg-[#0B3954] text-white" >
        <div className="container mx-auto px-6 text-center max-w-4xl">

          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
            Climate integrity requires verification.
          </h2>

          <p className="text-lg text-white/70 leading-relaxed">
            Nevara provides the geospatial and cryptographic infrastructure
            necessary to make coastal restoration measurable and defensible.
          </p>

        </div>
      </section >
      {/* Footer */}
      < footer className="py-12 bg-[#0B3954] text-white" >
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="w-6 h-6 text-[#00A896]" />
            <p className="text-lg" data-testid="text-footer-copyright">
              © 2025 Nevara. Built for a Sustainable Future.
            </p>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-300">
            <Link href="/terms" className="hover:text-white underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white underline">Privacy Policy</Link>
          </div>
        </div>
      </footer >
    </div >
  );
}

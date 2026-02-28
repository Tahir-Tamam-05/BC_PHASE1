import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Waves, Leaf, Shield, Globe, Award, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(0, { duration: 1500 });
  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());
  
  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);
  
  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{display}</motion.span>{suffix}
    </span>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <Leaf className="w-8 h-8 text-emerald-400" />
        </div>
        
        <div className="space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-white"
          >
            BlueCarbon Ledger
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-light text-brand-accent"
          >
            The Future of Carbon Credits
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="space-y-3"
        >
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Blockchain-powered transparency for ocean and coastal ecosystem carbon credits.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            size="lg"
            className="bg-brand-primary text-white hover:bg-brand-accent rounded-xl px-6 py-3 transition-colors duration-200"
          >
            Start a Project
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-800/50 rounded-xl px-6 py-3 transition-colors duration-200 backdrop-blur-sm"
          >
            Explore Marketplace
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const { data: stats } = useQuery<{ totalProjects: number; verifiedProjects: number; totalCO2Captured: number }>({
    queryKey: ['/api/stats'],
  });

  const statsData = [
    { label: 'Projects Verified', value: stats?.verifiedProjects || 0, icon: Globe },
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: Award },
    { label: 'Tons CO₂ Offset', value: stats?.totalCO2Captured || 0, suffix: '+', icon: TrendingUp },
  ];

  return (
    <section className="py-40 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-24">
          {statsData.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-6">
              <stat.icon className="w-5 h-5 text-brand-accent opacity-40" />
              <div className="text-6xl md:text-7xl font-semibold tracking-tight text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="uppercase tracking-widest text-xs text-brand-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Submit Project',
      description: 'Contributors submit blue carbon projects with GIS data and proof documentation.',
    },
    {
      number: '02',
      title: 'Verification',
      description: 'Independent verifiers review and approve projects based on strict criteria.',
    },
    {
      number: '03',
      title: 'Tokenization',
      description: 'Approved projects are tokenized as blockchain credits with immutable records.',
    },
    {
      number: '04',
      title: 'Trading',
      description: 'Buyers can purchase verified carbon credits through our marketplace.',
    },
  ];

  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            A transparent four-step process from project submission to carbon credit trading.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="space-y-4">
              <div className="text-6xl font-light text-emerald-100">{step.number}</div>
              <h3 className="text-xl font-medium text-slate-900">{step.title}</h3>
              <p className="text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const features = [
    {
      icon: Shield,
      title: 'Blockchain Verified',
      description: 'Every transaction is recorded on an immutable blockchain ledger.',
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'Compliant with international carbon credit verification standards.',
    },
    {
      icon: Award,
      title: 'Industry Recognized',
      description: 'Awards and recognition from leading environmental organizations.',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <feature.icon className="w-7 h-7 text-slate-700" />
              </div>
              <h3 className="text-xl font-medium text-slate-900">{feature.title}</h3>
              <p className="text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-6">
          Ready to Make an Impact?
        </h2>
        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
          Join thousands of contributors and buyers in the fight against climate change.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg"
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 h-12"
          >
            Start Now
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-8 h-12"
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-slate-900">BlueCarbon Ledger</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <span>© 2024 BlueCarbon Ledger</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPremium() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-800">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
      <Footer />
    </div>
  );
}

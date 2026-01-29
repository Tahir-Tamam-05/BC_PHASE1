import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waves, Leaf, Upload, Shield, Link2, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import mangroveHero from '@assets/stock_images/mangrove_trees_in_wa_df0d8991.jpg';
import mangroveEcosystem from '@assets/stock_images/mangrove_forest_unde_2f49118f.jpg';
import saltMarsh from '@assets/stock_images/salt_marsh_wetland_c_09b253ba.jpg';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Animated Background Image - Mangrove */}
        <img 
          src={mangroveHero}
          alt="Mangrove trees in tropical coastal water with vibrant green foliage"
          className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
          data-testid="hero-bg-image"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B3954]/90 via-[#0B3954]/80 to-[#00A896]/70" role="presentation" />
        
        {/* Animated flowing gradient (simulating water movement) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B3954]/50 via-transparent to-[#00A896]/30 animate-wave-flow" role="presentation" />
        
        {/* Additional subtle pulse for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent animate-pulse" style={{ animationDuration: '6s' }} role="presentation" />
        
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
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight" data-testid="text-hero-title">
                BlueCarbon Ledger
              </h1>
            </div>
            
            {/* Subtitle */}
            <h2 className="text-3xl md:text-4xl font-semibold text-white/95" data-testid="text-hero-subtitle">
              Blockchain-Powered Blue Carbon Credit Registry
            </h2>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed" data-testid="text-hero-description">
              Secure, transparent, and verifiable carbon credits from ocean and coastal ecosystems.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <Button 
                size="lg" 
                className="bg-[#00A896] border-[#00A896] text-white hover:bg-[#00A896]/90 shadow-lg min-w-[180px] text-lg h-14"
                onClick={() => setLocation('/login')}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 text-white border-white/40 backdrop-blur-md hover:bg-white/20 min-w-[180px] text-lg h-14"
                onClick={() => setLocation('/explorer')}
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>

            {/* Stats Section - Glassmorphism Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:bg-white/15 transition-all hover:scale-105">
                <div className="text-5xl font-bold mb-3 text-white" data-testid="stat-carbon-credits">245K+</div>
                <div className="text-white/80 text-lg" data-testid="label-carbon-credits">Carbon Credits</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:bg-white/15 transition-all hover:scale-105">
                <div className="text-5xl font-bold mb-3 text-white" data-testid="stat-active-projects">156</div>
                <div className="text-white/80 text-lg" data-testid="label-active-projects">Active Projects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-xl hover:bg-white/15 transition-all hover:scale-105">
                <div className="text-5xl font-bold mb-3 text-white" data-testid="stat-verified-transactions">1.8K</div>
                <div className="text-white/80 text-lg" data-testid="label-verified-transactions">Verified Transactions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How This Works Section */}
      <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6" data-testid="text-section-how-it-works">
              How This Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-how-it-works-description">
              A transparent, blockchain-powered process from project submission to verified carbon credits
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1: Submit Projects */}
              <div className="relative" data-testid="card-step-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A896] to-[#0B3954] flex items-center justify-center mb-6 shadow-xl">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-10 left-[60%] hidden lg:block">
                    <div className="w-32 h-0.5 bg-gradient-to-r from-[#00A896] to-transparent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-step-1-title">1. Submit Project</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-step-1-description">
                    Submit your blue carbon restoration project with location, area, and ecosystem details. Our system automatically calculates carbon sequestration potential.
                  </p>
                </div>
              </div>

              {/* Step 2: Expert Verification */}
              <div className="relative" data-testid="card-step-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A896] to-[#0B3954] flex items-center justify-center mb-6 shadow-xl">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-10 left-[60%] hidden lg:block">
                    <div className="w-32 h-0.5 bg-gradient-to-r from-[#00A896] to-transparent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-step-2-title">2. Verification</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-step-2-description">
                    Certified verifiers review project documentation and validate carbon capture estimates using scientific methodologies.
                  </p>
                </div>
              </div>

              {/* Step 3: Blockchain Recording */}
              <div className="relative" data-testid="card-step-3">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A896] to-[#0B3954] flex items-center justify-center mb-6 shadow-xl">
                    <Link2 className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute top-10 left-[60%] hidden lg:block">
                    <div className="w-32 h-0.5 bg-gradient-to-r from-[#00A896] to-transparent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-step-3-title">3. Blockchain</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-step-3-description">
                    Approved projects are recorded on our immutable blockchain using SHA-256 cryptography and Merkle tree validation.
                  </p>
                </div>
              </div>

              {/* Step 4: Transparent Tracking */}
              <div className="relative" data-testid="card-step-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A896] to-[#0B3954] flex items-center justify-center mb-6 shadow-xl">
                    <Eye className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" data-testid="text-step-4-title">4. Public Ledger</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-step-4-description">
                    All transactions, blocks, and carbon credits are publicly accessible in our blockchain explorer for complete transparency.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Button 
                size="lg" 
                className="bg-[#00A896] text-white hover:bg-[#00A896]/90 shadow-lg text-lg h-14 px-8"
                onClick={() => setLocation('/login')}
                data-testid="button-start-journey"
              >
                Start Your Journey
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Blue Carbon Ecosystems Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6" data-testid="text-section-ecosystems">
              Blue Carbon Ecosystems
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-ecosystems-description">
              Supporting the world's most powerful natural carbon sinks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Mangroves Card */}
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2" data-testid="card-ecosystem-mangroves">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={mangroveEcosystem}
                  alt="Mangrove trees with underwater roots in coastal water"
                  className="w-full h-full object-cover transition-transform hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <CardContent className="p-8 bg-card">
                <h3 className="text-2xl font-bold mb-4" data-testid="text-ecosystem-1-title">Mangroves</h3>
                <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-ecosystem-1-description">
                  Coastal forests that sequester up to 10x more carbon than terrestrial forests.
                </p>
              </CardContent>
            </Card>

            {/* Seagrass Meadows Card */}
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2" data-testid="card-ecosystem-seagrass">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=800&q=80"
                  alt="Underwater seagrass meadows"
                  className="w-full h-full object-cover transition-transform hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <CardContent className="p-8 bg-card">
                <h3 className="text-2xl font-bold mb-4" data-testid="text-ecosystem-2-title">Seagrass Meadows</h3>
                <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-ecosystem-2-description">
                  Underwater meadows storing carbon in sediments for millennia.
                </p>
              </CardContent>
            </Card>

            {/* Salt Marshes Card */}
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2" data-testid="card-ecosystem-salt-marshes">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={saltMarsh}
                  alt="Salt marsh wetland with coastal vegetation"
                  className="w-full h-full object-cover transition-transform hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <CardContent className="p-8 bg-card">
                <h3 className="text-2xl font-bold mb-4" data-testid="text-ecosystem-3-title">Salt Marshes</h3>
                <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-ecosystem-3-description">
                  Tidal wetlands with exceptional carbon capture capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Active Projects Section */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6" data-testid="text-section-projects">
              Active Projects
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-projects-description">
              Real-world coastal restoration projects making a measurable impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Project 1 */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="card-project-1">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80"
                  alt="Coastal restoration project"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-[#00A896] text-white border-0" data-testid="badge-project-1-status">
                  Verified
                </Badge>
              </div>
              <CardContent className="p-6 bg-card">
                <h3 className="text-xl font-bold mb-2" data-testid="text-project-1-title">Restore Mangrove Bay</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-project-1-info">Coastal restoration • 120 hectares</p>
              </CardContent>
            </Card>

            {/* Project 2 */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="card-project-2">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=600&q=80"
                  alt="Ocean conservation project"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-blue-500 text-white border-0" data-testid="badge-project-2-status">
                  Ongoing
                </Badge>
              </div>
              <CardContent className="p-6 bg-card">
                <h3 className="text-xl font-bold mb-2" data-testid="text-project-2-title">Pacific Seagrass Revival</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-project-2-info">Underwater restoration • 85 hectares</p>
              </CardContent>
            </Card>

            {/* Project 3 */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="card-project-3">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?auto=format&fit=crop&w=600&q=80"
                  alt="Salt marsh restoration"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-[#00A896] text-white border-0" data-testid="badge-project-3-status">
                  Verified
                </Badge>
              </div>
              <CardContent className="p-6 bg-card">
                <h3 className="text-xl font-bold mb-2" data-testid="text-project-3-title">Atlantic Salt Marsh</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-project-3-info">Tidal wetlands • 200 hectares</p>
              </CardContent>
            </Card>

            {/* Project 4 */}
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" data-testid="card-project-4">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80"
                  alt="Coastal ecosystem project"
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0" data-testid="badge-project-4-status">
                  New
                </Badge>
              </div>
              <CardContent className="p-6 bg-card">
                <h3 className="text-xl font-bold mb-2" data-testid="text-project-4-title">Caribbean Blue Initiative</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-project-4-info">Multi-ecosystem • 300 hectares</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0B3954] text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Waves className="w-6 h-6 text-[#00A896]" />
            <p className="text-lg" data-testid="text-footer-copyright">
              © 2025 BlueCarbon Ledger. Built for a Sustainable Future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { GlassButton } from '@/components/common/GlassButton';
import { GlassCard } from '@/components/common/GlassCard';
import { MapPin, Shield, Clock, CreditCard, Star, DollarSign, Car } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100svh] bg-bg-primary text-white relative overflow-x-hidden">
      {/* Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Navbar */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-8 h-8 text-brand-purple" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--brand-gradient)]">ParkEase</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden md:block text-sm font-medium text-white/80 hover:text-white transition-colors">Sign In</Link>
          <Link to="/register">
            <GlassButton variant="primary" className="py-2 px-6 text-sm">Get Started</GlassButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center z-10 min-h-[90vh] justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          🚗 Smart P2P Parking Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 bg-clip-text text-transparent bg-[var(--brand-gradient)]">
          Park Smarter.<br />Earn From Your Space.
        </h1>
        
        <p className="text-xl text-white/60 max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          ParkEase connects drivers with private parking owners for affordable, flexible, and secure parking — right where you need it.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link to="/seeker/map">
            <GlassButton variant="primary" className="w-full sm:w-auto text-lg px-8 py-4">Find Parking →</GlassButton>
          </Link>
          <Link to="/register">
            <GlassButton variant="ghost" className="w-full sm:w-auto text-lg px-8 py-4 border border-white/20">List Your Space</GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full animate-in fade-in duration-1000 delay-500">
          {['2,400+ Spaces', '15,000+ Drivers', '₹12M+ Saved', '4.8★ Rating'].map((stat, i) => (
            <GlassCard key={i} className="py-4 px-6 text-center">
              <span className="text-lg font-bold text-brand-cyan">{stat}</span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ParkEase?</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Everything you need for a seamless parking experience, whether you're parking or hosting.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Find Nearby Parking', desc: 'Instantly locate available spaces around your destination.' },
              { icon: Shield, title: 'Privacy Protected', desc: 'Exact locations revealed only after confirmed booking.' },
              { icon: Clock, title: 'Flexible Booking', desc: 'Book by the hour, day, or month with live availability.' },
              { icon: CreditCard, title: 'Secure Payments', desc: 'Fast, secure transactions powered by Razorpay.' },
              { icon: Star, title: 'Verified Spaces', desc: 'Every parking space and owner is KYC verified.' },
              { icon: DollarSign, title: 'Earn as Owner', desc: 'Turn your empty driveway into a passive income stream.' },
            ].map((feature, i) => (
              <GlassCard key={i} hover className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 relative z-10 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-purple/0 via-brand-purple/50 to-brand-purple/0"></div>
            {[
              { step: '01', title: 'Search', desc: 'Enter your destination and find available spaces nearby.' },
              { step: '02', title: 'Book', desc: 'Choose your dates, vehicle type, and pay securely.' },
              { step: '03', title: 'Park', desc: 'Navigate to the exact location and park hassle-free.' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-bg-primary border-2 border-brand-purple flex items-center justify-center text-3xl font-bold text-brand-purple mb-6 shadow-glow">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-white/60 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative z-10">
        <GlassCard className="max-w-4xl mx-auto p-12 text-center border-brand-purple/30 bg-brand-purple/5">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">Join thousands of users already saving time and money with ParkEase.</p>
          <Link to="/register">
            <GlassButton variant="primary" className="text-lg px-10 py-4">Create Free Account</GlassButton>
          </Link>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6 text-brand-purple" />
            <span className="text-xl font-bold">ParkEase</span>
          </div>
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} ParkEase. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/60">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { Link } from 'react-router-dom'
import { MapPin, Shield, Clock, CreditCard, Star, Users } from 'lucide-react'

const features = [
  { icon: MapPin,     title: 'Find Nearby Parking', desc: 'Instantly discover available private parking spaces within your preferred radius.' },
  { icon: Shield,     title: 'Privacy Protected',   desc: 'Exact location revealed only after payment. Masked coordinates shown during search.' },
  { icon: Clock,      title: 'Flexible Booking',    desc: 'Book by the hour, for a day, or recurring. Cancel anytime before start.' },
  { icon: CreditCard, title: 'Secure Payments',     desc: 'Stripe-powered checkout with instant confirmation and hassle-free refunds.' },
  { icon: Star,       title: 'Verified Spaces',     desc: 'Admin-approved listings with owner KYC verification for your peace of mind.' },
  { icon: Users,      title: 'Earn as an Owner',    desc: 'Monetise your unused parking. Set your price and availability.' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-32 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 -right-32 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-sm rounded-full px-4 py-1.5 mb-6">
            <MapPin size={14} /> Smart Peer-to-Peer Parking
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Park smarter.<br />Earn from your space.
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto mb-10">
            ParkEase connects drivers with private parking owners for affordable, flexible, and secure parking — right where you need it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-white text-primary-700 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Find Parking
            </Link>
            <Link to="/register" className="btn-outline border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10">
              List Your Space
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Everything you need</h2>
        <p className="text-center text-gray-500 mb-12">Built for drivers and parking owners alike.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">Join thousands of drivers and space owners on ParkEase today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
              Create a free account
            </Link>
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

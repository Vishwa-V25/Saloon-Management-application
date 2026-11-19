import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  MapPin,
  Phone,
  Calendar,
  ArrowRight,
  Star,
  Award,
  Scissors,
  Instagram,
  Mail,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    caption: 'Bespoke Balayage & Gloss',
  },
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    caption: 'The Madison Atelier',
  },
  {
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    caption: 'Royal Hot Towel Grooming',
  },
  {
    url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
    caption: 'Editorial & Bridal Styling',
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    caption: 'Botanical Scalp Rituals',
  },
  {
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
    caption: 'Private Styling Suites',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/services?availableOnly=true'), api.get('/staff')])
      .then(([svcRes, stfRes]) => {
        setServices(svcRes.data.services || []);
        setStaff(stfRes.data.staff || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(services.map((s) => s.category))];
  const filteredServices =
    selectedCategory === 'All'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  const popularServices = services.filter((s) => s.isPopular || s.specialOfferText);

  const bookingTarget = ['customer', 'user'].includes(user?.role)
    ? '/customer/dashboard?tab=book'
    : '/login';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-obsidian">
      <Navbar />

      {/* HERO SECTION */}
      <section id="home" className="relative bg-obsidian text-ivory overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1800&q=80"
            alt="Maison Aurum Luxury Salon Interior"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/85 to-obsidian/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-400/40 bg-gold-500/10 text-gold-300 text-xs uppercase tracking-[0.2em] mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              New York • Madison Avenue
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] tracking-tight">
              The Art of <span className="text-gold-400 italic font-normal">Timeless</span> Hair & Grooming
            </h1>

            <p className="mt-6 text-lg text-zinc-300 leading-relaxed max-w-xl">
              Experience bespoke precision cuts, luminous color artistry, and restorative botanical rituals in an atmosphere of quiet luxury.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to={bookingTarget}
                className="inline-flex items-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold px-7 py-4 rounded-full shadow-gold transition transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4" />
                Book Your Appointment
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 border border-zinc-600 hover:border-gold-400 text-white hover:text-gold-300 font-medium px-7 py-4 rounded-full transition"
              >
                Explore Services
              </a>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-800/80 grid grid-cols-3 gap-6 max-w-lg">
              <div>
                <p className="font-serif text-3xl font-semibold text-gold-400">4.9★</p>
                <p className="text-xs text-zinc-400 mt-1">Client Satisfaction</p>
              </div>
              <div>
                <p className="font-serif text-3xl font-semibold text-white">12+</p>
                <p className="text-xs text-zinc-400 mt-1">Years of Craft</p>
              </div>
              <div>
                <p className="font-serif text-3xl font-semibold text-white">100%</p>
                <p className="text-xs text-zinc-400 mt-1">Botanical Care</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIAL OFFERS & POPULAR HIGHLIGHTS */}
      {popularServices.length > 0 && (
        <section className="bg-champagne/70 border-y border-gold-200/60 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gold-700 font-semibold">
                  Curated Highlights
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-obsidian mt-1">
                  Signature Offers & Most Popular
                </h2>
              </div>
              <Link
                to={bookingTarget}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-obsidian transition"
              >
                Reserve a session <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {popularServices.slice(0, 4).map((svc) => (
                <div
                  key={svc._id}
                  className="bg-white rounded-2xl p-5 border border-gold-200/80 shadow-sm hover:shadow-luxury transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-obsidian text-gold-300">
                        <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                        {svc.specialOfferText || 'Popular'}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold-600" />
                        {svc.duration} min
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-obsidian">{svc.name}</h3>
                    <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{svc.description}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="font-serif text-2xl font-semibold text-obsidian">
                      {formatINR(svc.price)}
                    </span>
                    <Link
                      to={bookingTarget}
                      className="text-xs font-semibold px-3.5 py-2 rounded-full bg-gold-500/15 text-gold-700 hover:bg-gold-500 hover:text-obsidian transition"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FULL SERVICES MENU */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-600 font-semibold">
            The Service Menu
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-obsidian mt-2">
            Bespoke Salon Experiences
          </h2>
          <p className="text-zinc-600 mt-3 text-sm sm:text-base">
            Every appointment begins with an individualized consultation tailored to your hair texture, lifestyle, and aesthetic.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-obsidian text-gold-300 shadow-sm'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:border-gold-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-zinc-200/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                className="group bg-white rounded-2xl overflow-hidden border border-zinc-200/80 hover:border-gold-400/70 shadow-sm hover:shadow-luxury transition-all duration-300 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden bg-zinc-900">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-obsidian/80 backdrop-blur-sm text-gold-300 text-[11px] font-medium border border-gold-500/30">
                    {service.category}
                  </span>
                  {service.specialOfferText && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gold-500 text-obsidian text-[11px] font-bold">
                      {service.specialOfferText}
                    </span>
                  )}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="flex items-center gap-1.5 text-xs bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      {service.duration} mins
                    </span>
                    <span className="font-serif text-2xl font-semibold text-gold-300">
                      {formatINR(service.price)}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-obsidian group-hover:text-gold-700 transition">
                      {service.name}
                    </h3>
                    <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <Link
                      to={bookingTarget}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-obsidian text-ivory hover:bg-gold-500 hover:text-obsidian font-medium text-sm transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ABOUT & MASTER STYLISTS */}
      <section id="about" className="bg-obsidian text-ivory py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <p className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
                Our Philosophy
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white mt-2 leading-tight">
                Crafted by Masters, Tailored to You
              </h2>
              <p className="text-zinc-300 mt-5 leading-relaxed text-sm sm:text-base">
                Founded on Madison Avenue, Maison Aurum blends Parisian hair architecture with modern restorative science. Our intimate atelier ensures unhurried, one-on-one attention from New York’s finest stylists and master barbers.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white text-sm">Award-Winning Artisans</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Editorial stylists trained in London, Paris, and Milan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white text-sm">Precision & Hygiene</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Hospital-grade sterilization and private treatment suites.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {staff.map((member) => (
                <div
                  key={member._id}
                  className="bg-charcoal border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gold-500/40 transition"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gold-400/60 shrink-0"
                  />
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-white">{member.name}</h3>
                    <p className="text-xs text-gold-400 font-medium">{member.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{member.specialty}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {member.experienceYears} yrs experience
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold-600 font-semibold">
              Visual Portfolio
            </p>
            <h2 className="font-serif text-4xl font-semibold text-obsidian mt-1">
              Inside Maison Aurum
            </h2>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            A glimpse into our serene styling suites, color lab, and signature transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GALLERY_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className="group relative h-64 rounded-2xl overflow-hidden bg-zinc-900 shadow-sm"
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition" />
              <p className="absolute bottom-4 left-4 font-serif text-xl text-white">
                {img.caption}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT, LOCATION & HOURS */}
      <section id="contact" className="bg-champagne border-t border-gold-200/70 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-obsidian text-ivory rounded-3xl p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center shadow-luxury">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
                Visit The Atelier
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white mt-2">
                Ready for Your Transformation?
              </h2>
              <p className="text-zinc-300 mt-4 text-sm sm:text-base leading-relaxed">
                Reserve your preferred stylist and time slot online in seconds. Walk-ins are welcomed subject to suite availability.
              </p>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex items-center gap-3 text-zinc-200">
                  <MapPin className="w-5 h-5 text-gold-400 shrink-0" />
                  <span>742 Madison Avenue, Suite 3B, New York, NY 10065</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-200">
                  <Phone className="w-5 h-5 text-gold-400 shrink-0" />
                  <span>+1 (212) 555-0100</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-200">
                  <Mail className="w-5 h-5 text-gold-400 shrink-0" />
                  <span>concierge@maisonaurum.com</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to={bookingTarget}
                  className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-obsidian font-semibold px-7 py-3.5 rounded-full shadow-gold transition"
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment Online
                </Link>
              </div>
            </div>

            <div className="bg-charcoal border border-zinc-800 rounded-2xl p-7 space-y-5">
              <h3 className="font-serif text-2xl font-semibold text-gold-300">Working Hours</h3>
              <div className="space-y-3 text-sm">
                {[
                  { day: 'Monday – Friday', hours: '9:00 AM – 8:00 PM' },
                  { day: 'Saturday', hours: '9:00 AM – 7:00 PM' },
                  { day: 'Sunday', hours: '10:00 AM – 6:00 PM' },
                ].map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between py-2.5 border-b border-zinc-800 last:border-none"
                  >
                    <span className="text-zinc-300">{row.day}</span>
                    <span className="font-semibold text-white">{row.hours}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-gold-400" />
                  @maisonaurum.nyc
                </span>
                <span>Complimentary Valet Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-obsidian text-zinc-400 border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Maison Aurum Salon & Grooming Atelier. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-gold-300 transition">
              Customer Portal
            </Link>
            <Link to="/owner-login" className="hover:text-gold-300 transition">
              Owner Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

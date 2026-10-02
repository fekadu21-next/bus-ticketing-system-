import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import { formatEtb } from '@/data/dummyTrips';

export const PassengerInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripData = location.state?.tripData || {};
  const selectedSeats = location.state?.selectedSeats || [];
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupLocation: '',
    dropoffLocation: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
    if (!formData.dropoffLocation.trim()) newErrors.dropoffLocation = 'Dropoff location is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    navigate('/payment', { state: { tripData, selectedSeats, passengerInfo: formData } });
  };

  const totalPrice = tripData.price * selectedSeats.length;

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/crops/detail_banner.jpg" alt="" className="w-full h-full object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071833]/88 via-[#0b2a4a]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-6 pt-8 pb-16">
          <Link to={`/trips/${tripData.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/90">
            <ArrowLeft size={14} />
            Back to Trip Details
          </Link>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-black text-white tracking-tight">Passenger Information</h1>
          <p className="mt-1 text-[13px] text-white/80">Please fill in your details to complete the booking.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 -mt-8 space-y-4 relative z-20">
        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">Trip Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900">{tripData.from}</p>
                <p className="text-[11px] text-slate-400">Departure</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900">{tripData.to}</p>
                <p className="text-[11px] text-slate-400">Destination</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-slate-900">Seats: {selectedSeats.join(', ')}</p>
                <p className="text-[11px] text-slate-400">Selected</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[14px] text-slate-600">Total Price</p>
            <p className="text-[24px] font-black text-slate-900">{formatEtb(totalPrice)}</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-4 sm:p-5">
          <h2 className="text-[18px] font-extrabold text-slate-900 mb-5">Personal Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">First Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.firstName ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.firstName && <p className="text-[11px] text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Last Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.lastName ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.phone ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Pickup Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    placeholder="Enter pickup location"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.pickupLocation ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.pickupLocation && <p className="text-[11px] text-red-500 mt-1">{errors.pickupLocation}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Dropoff Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="dropoffLocation"
                    value={formData.dropoffLocation}
                    onChange={handleChange}
                    placeholder="Enter dropoff location"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.dropoffLocation ? 'border-red-300' : 'border-slate-200'} text-[13px] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]`}
                  />
                </div>
                {errors.dropoffLocation && <p className="text-[11px] text-red-500 mt-1">{errors.dropoffLocation}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 h-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold inline-flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ArrowRight size={15} />
              </button>
              <Link
                to={`/trips/${tripData.id}`}
                className="h-11 px-6 rounded-full border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoPage;

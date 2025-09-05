"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Car, Users, Gauge, Menu, X, Calendar, HeadphonesIcon, CheckCircle, AlertCircle } from "lucide-react"

import { supabase } from "./lib/supabase"
import HeroPageCar2 from "./assets/HeroPage/car2.png"
import logo from "./assets/logo/logoRental.png"
import aboutcra from "./assets/aboutuscar.png"
import howitworks from "./assets/howitworks.jpg"


import BackgroundImage from "./assets/HeroPage/section_bg2.png"

// Success/Error Toast Component
const Toast = ({ type, message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-60 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
        'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {type === 'success' ? 
          <CheckCircle className="h-5 w-5 mr-3" /> : 
          <AlertCircle className="h-5 w-5 mr-3" />
        }
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}


// Rental Modal Component
const RentalModal = ({ isOpen, onClose, selectedCar }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    pickupDate: "",
    returnDate: "",
    pickupLocation: "",
    licenseNumber: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [rentalDays, setRentalDays] = useState(0)
  const [toast, setToast] = useState({ type: '', message: '', isVisible: false })

   // ✅ Prevent background scroll when modal is open
   useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Calculate total price when dates change
  useEffect(() => {
    if (formData.pickupDate && formData.returnDate && selectedCar) {
      const startDate = new Date(formData.pickupDate)
      const endDate = new Date(formData.returnDate)
      const timeDiff = endDate.getTime() - startDate.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff > 0) {
        setRentalDays(daysDiff)
        setTotalPrice(daysDiff * selectedCar.price_per_day)
      } else {
        setRentalDays(0)
        setTotalPrice(0)
      }
    }
  }, [formData.pickupDate, formData.returnDate, selectedCar])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const showToast = (type, message) => {
    setToast({ type, message, isVisible: true })
  }

  const hideToast = () => {
    setToast({ ...toast, isVisible: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate dates
      const startDate = new Date(formData.pickupDate)
      const endDate = new Date(formData.returnDate)
      
      if (endDate <= startDate) {
        showToast('error', 'Return date must be after pickup date')
        setIsSubmitting(false)
        return
      }

      // Check if dates are in the future
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) {
        showToast('error', 'Pickup date must be today or in the future')
        setIsSubmitting(false)
        return
      }

      // Check vehicle availability for the selected dates
      const { data: existingBookings, error: bookingError } = await supabase
  .from('bookings')
  .select('*')
  .eq('vehicle_id', selectedCar.id)
  .eq('status', 'confirmed')
  .lte('rental_start_date', formData.returnDate) // booking starts before return
  .gte('rental_end_date', formData.pickupDate)   // booking ends after pickup

      if (bookingError) throw bookingError

      if (existingBookings && existingBookings.length >= selectedCar.available_quantity) {
        showToast('error', 'Vehicle is not available for the selected dates')
        setIsSubmitting(false)
        return
      }
      

      // Create booking
      const bookingData = {
        vehicle_id: selectedCar.id,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        rental_start_date: formData.pickupDate,
        rental_end_date: formData.returnDate,
        pickup_location: formData.pickupLocation,
        license_number: formData.licenseNumber,
        total_price: totalPrice,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()

      if (error) throw error

      showToast('success', 'Booking submitted successfully! We will contact you shortly to confirm your reservation.')
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        pickupDate: "",
        returnDate: "",
        pickupLocation: "",
        licenseNumber: "",
      })
      
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Booking error:', error)
      showToast('error', 'Failed to submit booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>

    
      <Toast 
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Rent Your Car</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          

          {/* Selected Car Info */}
          {selectedCar && (
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedCar.image_url || selectedCar.image}
                  alt={`${selectedCar.make} ${selectedCar.model}`}
                  className="w-20 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCar.make} {selectedCar.model}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{selectedCar.year}</span>
                    <span>•</span>
                    <span>{selectedCar.seats} seats</span>
                    <span>•</span>
                    <span>{selectedCar.type}</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 mt-2">₱{selectedCar.price_per_day}/day</div>
                </div>
              </div>
              
              {/* Price Calculation */}
              {rentalDays > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>Rental Period:</span>
                    <span className="font-semibold">{rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span>Daily Rate:</span>
                    <span>₱{selectedCar.price_per_day}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-green-600">₱{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          

          {/* Rental Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your driving license number"
                  />
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date *</label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Return Date *</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleInputChange}
                    required
                    min={formData.pickupDate || new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your preferred pickup location"
                />
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rentalDays === 0}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : `Submit Rental Request${totalPrice > 0 ? ` (₱${totalPrice.toLocaleString()})` : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// Navbar Component
const Navbar = ({ onRentClick, scrollToSection, refs }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-[#eff2f7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center flex-shrink-0">
            <img src={logo} alt="The Rental Den Logo" className="h-15 w-auto mr-2" />
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection(refs.heroRef)}
              className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection(refs.whyChooseUsRef)}
              className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
            >
              ABOUT US
            </button>
            <button
              onClick={() => scrollToSection(refs.fleetRef)}
              className="text-gray-600 font-medium hover:text-blue-600 transition-colors"
            >
              CARS
            </button>
            <button
              onClick={onRentClick}
              className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              Rent Now
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-600 hover:text-gray-900">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              <button onClick={() => scrollToSection(refs.heroRef)} className="block px-3 py-2 text-gray-900 font-medium">
                HOME
              </button>
              <button onClick={() => scrollToSection(refs.whyChooseUsRef)} className="block px-3 py-2 text-gray-600 font-medium">
                ABOUT US
              </button>
              <button onClick={() => scrollToSection(refs.fleetRef)} className="block px-3 py-2 text-gray-600 font-medium">
                CARS
              </button>
              <button
                onClick={onRentClick}
                className="w-full mt-4 bg-black text-white px-6 py-3 rounded-md font-medium"
              >
                Rent Now
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


// Hero Section Component
const HeroSection = () => {
  const [loaded, setLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    // Trigger zoom-in animation after mount
    setTimeout(() => setLoaded(true), 100)

    // Track scroll for movement
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
    <div className="relative h-[1000px] bg-[#eff2f7] ">
      <section className="bg-gradient-to-b w-full overflow-hidden absolute pt-20 pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 items-center ">
            {/* Left Content */}
            <div className="lg:pr-16 relative z-20 mb-5">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                Find Your <br />
                Perfect Ride <br />
                Today
              </h1>
              <p className="text-3xl font-normal text-gray-900 leading-relaxed">
                From Comfort to Luxury, <br />
                It's All in One Den
              </p>
            </div>
  
            {/* Right Content - Car with animation */}
            <div className="relative lg:-ml-25 z-50 w-[1100px] -mt-8 flex justify-center">
              {/* Speed Blur Effect */}
              <div
                className="absolute inset-y-10 right-0 w-full rounded-full blur-3xl"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)",
                  transform: `translateX(${scrollY * 0.5}px)`,
                  zIndex: -1,
                }}
              ></div>
  
              {/* Car */}
              <img
                src={HeroPageCar2}
                alt={HeroPageCar2}
                className={`w-full max-w-4xl object-contain drop-shadow-2xl transform transition-all duration-1000 ease-out ${
                  loaded ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
                style={{
                  transform: `translateX(${scrollY * 0.3}px) scale(${
                    loaded ? 1 : 0.75
                  })`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
  
      {/* New Section with Background Image */}
      <section
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${BackgroundImage})`, position: `absolute`, top: `80px` }}
        
      ></section>
    </div>
      
    </>
  )
  
  
}

// Why Choose Us Component
const WhyChooseUs = () => {
  const features = [
    {
      icon: <Car className="h-10 w-10" />,
      title: "Quality Vehicles",
      description: "We maintain our fleet to the highest standards so you can enjoy a safe and smooth ride every time.",
    },
    {
      icon: <Calendar className="h-10 w-10" />,
      title: "Seamless Booking Experience",
      description: "Simple, fast, and user-friendly. Book your car online in minutes, with instant confirmation.",
    },
    {
      icon: <HeadphonesIcon className="h-10 w-10" />,
      title: "Local Expertise & Friendly Support",
      description:
        "Our Cebu-based team is here to help with tailored tips, great deals, and customer support whenever you need it.",
    },
  ]

  return (
    <section className="py-20  bg-[#F0F5F8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Why Choose Us?</h2>
        <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
          Enjoy a hassle-free ride with reliable cars, fast booking, and friendly support trusted by locals and tourists
          alike.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-black text-white p-10 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              <div className="text-white mb-8 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-6">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// About Section Component
const AboutSection = () => {
  return (
    <section className="py-20 py-20 bg-[#F0F5F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Vertical Image */}
          <div>
            <img
              src={aboutcra}
              alt="Car side mirror with blurred road background"
              className="w-[1000px] h-[400px] rounded-xl object-cover shadow-lg"
            />
          </div>

          {/* Right Side - Content */}
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center text-gray-500">
              <div className="rounded-lg flex items-center justify-center">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-16 text-left">About Rental Den</h2>
              </div>
              <p>
                "Welcome to The Rental Den, your premier car rental service. We are passionate about providing our
                customers with an exceptional and seamless rental experience. Born from a love for travel and
                exploration, we understand the importance of having a reliable vehicle to make your journey memorable.
                Our mission is to offer a diverse, high-quality fleet, from economy cars for city trips to spacious SUVs
                for family adventures. We are committed to transparent pricing, straightforward booking, and friendly,
                local customer support to ensure your complete satisfaction. At The Rental Den, we don't just rent cars;
                we help you create lasting memories."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// HowItWorks Component
const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Find a Car You'll Love",
      description:
        "Take a look through our curated collection of vehicles. Whether you need efficiency, space, or a bit of luxury, your perfect match is waiting for you right here in our fleet.",
    },
    {
      number: "02",
      title: "Secure Your Dates Online",
      description:
        "Once you’ve made your choice, our simple booking process makes it a breeze to lock in your rental. Just pick your dates, provide a few details, and your car will be reserved just for you.",
    },
    {
      number: "03",
      title: "Start Your Adventure",
      description:
        "Come see us to pick up your keys! Our friendly team will get you checked in quickly so you can start your journey. All that's left to do is enjoy the ride.",
    },
  ]

  return (
    <section className="relative w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left column */}
        <div className="bg-[#101010] text-white py-16 lg:py-20 px-6 md:px-10 lg:pl-16 xl:pl-24 lg:pr-10 flex flex-col">
          {/* Centered heading */}
          <div className="flex justify-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-10">How It Works</h2>
          </div>

          {/* Steps */}
          <div className="space-y-12 max-w-2xl mx-auto">
            {steps.map((s) => (
              <div key={s.number} className="flex items-start">
                <span className="text-5xl font-bold leading-none mr-6 w-16">{s.number}</span>
                <div className="mt-5"> {/* pushes title slightly below the number */}
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: background image */}
        <div className="relative">
          <img
            src={howitworks}
            alt="Car side mirror on a rainy road"
            className="absolute top-0 right-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}



// Car Card Component
const CarCard = ({ car, onRentClick }) => {
  const defaultImage =
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 w-full max-w-[500px] mx-auto">
   <div className="relative">
  <img
    src={car.image_url || defaultImage}
    alt={`${car.make} ${car.model}`}
    loading="lazy"
    className={`w-full h-64 object-cover ${
      !car.available ? "filter blur-xs" : ""
    }`}
  />

  {!car.available && (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-white font-bold text-2xl bg-opacity-60 px-4 py-2 rounded-lg">
        Not Available
      </span>
    </div>
  )}
</div>


      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {car.make} {car.model} ({car.year})
        </h3>

        {/* Car specifications */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-900">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
            <span>{car.mileage ? `${car.mileage.toLocaleString()} km` : "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <span>{car.seats} seats</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
            <span>{car.type}</span>
          </div>
        </div>

        {/* Price and availability */}
        <div className="mb-6">
          <div className="text-2xl font-bold text-green-600 mb-1">₱{car.price_per_day}/day</div>
          <div className="text-sm text-gray-500">
            Available: {car.available_quantity}/{car.total_quantity} units
          </div>
          {car.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{car.description}</p>}
        </div>

        {/* Buttons */}
        <button
          onClick={() => onRentClick(car)}
          disabled={!car.available || car.available_quantity === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            car.available && car.available_quantity > 0
              ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {car.available && car.available_quantity > 0 ? "Rent Now" : "Unavailable"}
        </button>
      </div>
    </div>
  )
}

// Fleet Section Component
const FleetSection = ({ onRentClick }) => {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setVehicles(data || [])
      } catch (error) {
        console.error("Error fetching vehicles:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  return (
    <section className="py-20 bg-[#F0F5F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Explore Our Fleet</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find the perfect car for your needs with our special rental offers. We provide a wide selection of
            vehicles, easy booking, and exceptional value for your next journey.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center  items-center py-20">
            <div className="text-lg text-gray-600">Loading vehicles...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-lg text-red-600">Error loading vehicles: {error}</div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-lg text-gray-600">No vehicles available at the moment.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">
            {vehicles.map((vehicle) => (
              <CarCard key={vehicle.id} car={vehicle} onRentClick={onRentClick} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}


const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "What do I need to rent a car?",
      answer:
        "You’ll need a valid driver’s license, a government-issued ID, and a credit or debit card for the security deposit.",
    },
    {
      question: "Can I extend my booking?",
      answer:
        "Yes, as long as the car is available. Simply reach out to us before your rental period ends to extend your booking.",
    },
    {
      question: "Is insurance included?",
      answer:
        "All rentals include basic insurance coverage. You can also upgrade to full coverage for extra peace of mind.",
    },
    {
      question: "Do you offer delivery or pickup services?",
      answer:
        "Yes! We can deliver the car to your preferred location or arrange pickup at one of our designated points.",
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-[#101010] text-white py-20 px-6 md:px-10 lg:px-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">FAQs</h2>
          <p className="text-gray-300 text-lg">
            Have a question? We’ve got you covered. Here are some of our most frequently asked questions.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-[#1A1A1A] rounded-2xl p-6 shadow-md cursor-pointer transition hover:bg-[#222222]"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {openIndex === index && (
                <p className="text-gray-400 mt-4 leading-relaxed">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Main App Component
const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState(null)

  const heroRef = useRef(null)
  const whyChooseUsRef = useRef(null)
  const aboutRef = useRef(null)
  const fleetRef = useRef(null)
  const faqRef = useRef(null) 

  const handleRentClick = (car = null) => {
    setSelectedCar(car)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCar(null)
  }
  const scrollToSection = (section) => {
    section.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#F0F5F8] flex flex-col">
      <Navbar
        onRentClick={() => handleRentClick()}
        scrollToSection={scrollToSection}
        refs={{ heroRef, whyChooseUsRef, aboutRef, fleetRef, faqRef }}
      />

      <div ref={heroRef}><HeroSection /></div>
      <div ref={whyChooseUsRef}><WhyChooseUs /></div>
      <div ref={aboutRef}><AboutSection /></div>
      {/* New Section Here */}
      <HowItWorks />
      <div ref={fleetRef}><FleetSection onRentClick={handleRentClick} /></div>

      <RentalModal isOpen={isModalOpen} onClose={handleCloseModal} selectedCar={selectedCar} />
            <div ref={faqRef}><FAQs /></div>

      
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}


export default App
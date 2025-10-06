
import { useState, useEffect, useRef } from "react"
import CarsPage from './CarsPage'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, X, CheckCircle, AlertCircle, Menu, ChevronLeft, ChevronRight, Calendar, User, Clock, CreditCard, Upload } from "lucide-react"
import { Car, Users, Gauge } from "lucide-react"
import { MapPin, Phone, Mail, Clock as ClockIcon } from "lucide-react"
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa"
import { supabase } from "./lib/supabase"
import { IoSpeedometerOutline, IoPeopleOutline, IoCarOutline } from "react-icons/io5";
import HeroPageCar2 from "./assets/HeroPage/car2.png"
import logo from "./assets/logo/logoRental.png"
import aboutcra from "./assets/aboutuscar.jpg"
import aboutcircle from "./assets/circleBg.jpg"
import carImage from "./assets/Cars.png"
import faqscar from "./assets/faqspic.png"
import faqscar1 from "./assets/faqscar.png"
import carIcon from "./assets/iconscar.png"
import calendarIcon from "./assets/iconscalendar.png"
import supportIcon from "./assets/iconssupport.png"
import BackgroundImage from "./assets/HeroPage/section_bg2.png"
import defaultBackground from "./assets/CarScreen/background.jpg";
import RentalBot from "../Chatbot/Rentalbot"


/* ===========================
   ✅ Success/Error Toast
   =========================== */
const Toast = ({ type, message, isVisible, onClose }) => {
  useEffect(() => {
    if (!isVisible) return
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg ${
          type === "success"
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
        }`}
      >
        {type === "success" ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const DetailsModal = ({ isOpen, onClose, car, onRentClick }) => {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    const fetchVariants = async () => {
      if (!car?.id) return;
      const { data, error } = await supabase
        .from("vehicle_variants")
        .select("*")
        .eq("vehicle_id", car.id);
      if (!error) {
        setVariants(data || []);
        if (data && data.length > 0) {
          setSelectedVariant(data[0]);
        }
      }
    };
    if (isOpen) fetchVariants();
  }, [isOpen, car]);

  if (!isOpen || !car) return null;

  const renderColorSwatch = (variant) => {
    const colorName = variant.color.toLowerCase();
    let bgColor = "#e5e7eb";

    if (colorName.includes("white") || colorName.includes("pearl"))
      bgColor = "#ffffff";
    else if (colorName.includes("black") || colorName.includes("midnight"))
      bgColor = "#1f2937";
    else if (colorName.includes("silver") || colorName.includes("metallic"))
      bgColor = "#9ca3af";
    else if (colorName.includes("red")) bgColor = "#dc2626";
    else if (colorName.includes("blue")) bgColor = "#2563eb";
    else if (colorName.includes("gray") || colorName.includes("grey"))
      bgColor = "#6b7280";
    else if (colorName.includes("green")) bgColor = "#16a34a";
    else if (colorName.includes("yellow") || colorName.includes("gold"))
      bgColor = "#facc15";
    else if (colorName.includes("orange")) bgColor = "#f97316";
    else if (colorName.includes("brown")) bgColor = "#7c4a31";
    else if (colorName.includes("purple")) bgColor = "#8b5cf6";
    else if (colorName.includes("pink")) bgColor = "#ec4899";

    const isSelected = selectedVariant?.id === variant.id;

    return (
      <button
        key={variant.id}
        onClick={() => setSelectedVariant(variant)}
        className={`rounded-full transition-all duration-200
          ${isSelected ? "w-6 h-6 scale-125 shadow-md" : "w-4 h-4"}
        `}
        style={{
          backgroundColor: bgColor,
          border: bgColor === "#ffffff" ? "1px solid #e5e7eb" : "none",
        }}
        title={variant.color}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-50 rounded-3xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        
        {/* LEFT SIDE - Car Image */}
        <div
          className="relative lg:w-3/5 w-full flex items-center justify-center p-6 bg-cover bg-center"
          style={{
            backgroundImage: `url(${defaultBackground})`,
          }}
        >
          <div className="relative w-full max-w-2xl flex items-center justify-center">
            <img
              src={selectedVariant?.image_url || car.image_url || defaultBackground}
              alt={`${car.make} ${car.model}`}
              className="w-[600px] h-auto object-contain drop-shadow-2xl scale-110 mt-20"
            />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg">
              {variants.map(renderColorSwatch)}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Car Details */}
        <div className="relative lg:w-2/5 w-full flex flex-col p-8 overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {car.model}
            </h1>
            <h2 className="text-xl font-light text-gray-700">
              {car.make}
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 ml-2">
                {car.year}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <IoSpeedometerOutline className="h-4 w-4 text-gray-500" />
              <span>
                {car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <IoPeopleOutline className="h-4 w-4 text-gray-500" />
              <span>{car.seats} Seater</span>
            </div>
            <div className="flex items-center gap-2">
              <IoCarOutline className="h-4 w-4 text-gray-500" />
              <span>{car.type || "N/A"}</span>
            </div>
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-6">
            ₱{selectedVariant?.price_per_day?.toLocaleString() || car.price_per_day?.toLocaleString()}
            <span className="text-lg font-normal text-gray-500">/day</span>
          </div>

          <div className="flex-1 mb-6">
            <p className="text-gray-600 leading-relaxed">
              {car.description ||
                "Experience luxury and performance with this premium vehicle. Perfect for business trips, special occasions, or when you simply want to enjoy the finest driving experience."}
            </p>
          </div>

          {/* Selected Variant Info */}
          {selectedVariant && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Selected Color</div>
                  <div className="font-semibold text-gray-900">{selectedVariant.color}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-semibold">Available</div>
                  <div className="text-xs text-gray-500">Book your dates</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto">
            <button
              onClick={() => {
                onClose();
                onRentClick(car, selectedVariant);
              }}
              className="w-full py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 bg-black text-gray-50 hover:bg-gray-800 hover:shadow-xl"
            >
              Rent Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const RentalModal = ({ isOpen, onClose, selectedCar, refreshBookings }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    pickupDate: "",
    returnDate: "",
    pickupLocation: "",
    licenseNumber: "",
    vehicleVariantId: "",
  });
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [govIdFile, setGovIdFile] = useState(null);
  const [govIdPreview, setGovIdPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [rentalDays, setRentalDays] = useState(0);
  const [toast, setToast] = useState({ type: "", message: "", isVisible: false });
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  // Fetch booked dates for the selected variant
  const fetchBookedDates = async (variantId) => {
    if (!variantId) return;
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("rental_start_date, rental_end_date")
        .eq("vehicle_variant_id", variantId)
        .eq("status", "confirmed");

      if (!error && data) {
        const dates = [];
        data.forEach(booking => {
          const start = new Date(booking.rental_start_date);
          const end = new Date(booking.rental_end_date);
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d).toISOString().split('T')[0]);
          }
        });
        setBookedDates(dates);
      }
    } catch (err) {
      console.error('Error fetching booked dates:', err);
    }
  };

  const refreshVariants = async () => {
    if (!selectedCar?.id) return;
    setVariantsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicle_variants")
        .select("*")
        .eq("vehicle_id", selectedCar.id);
  
      if (!error && data) {
        setVariants(data);
        const firstVariant = data[0];
        if (firstVariant) {
          setSelectedVariant(firstVariant);
          setFormData((s) => ({ ...s, vehicleVariantId: firstVariant.id }));
          fetchBookedDates(firstVariant.id);
        }
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) refreshVariants();
  }, [isOpen, selectedCar]);

  useEffect(() => {
    if (formData.pickupDate && formData.returnDate && selectedCar) {
      const start = new Date(formData.pickupDate);
      const end = new Date(formData.returnDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0) {
        const days = diffDays === 0 ? 1 : diffDays;
        setRentalDays(days);
        setTotalPrice(days * (selectedVariant?.price_per_day || selectedCar.price_per_day || 0));
      } else {
        setRentalDays(0);
        setTotalPrice(0);
      }
    } else {
      setRentalDays(0);
      setTotalPrice(0);
    }
  }, [formData.pickupDate, formData.returnDate, selectedCar, selectedVariant]);

  const showToast = (type, message) => setToast({ type, message, isVisible: true });
  const hideToast = () => setToast((t) => ({ ...t, isVisible: false }));

  const handleInputChange = (e) => setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setFormData((s) => ({ ...s, vehicleVariantId: variant?.id || "", pickupDate: "", returnDate: "" }));
    fetchBookedDates(variant?.id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      showToast("error", "Only JPG/PNG images allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File size must be under 5MB");
      return;
    }
    setGovIdFile(file);
    setGovIdPreview(URL.createObjectURL(file));
  };

  const isDateBooked = (dateString) => {
    return bookedDates.includes(dateString);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!formData.vehicleVariantId) {
        showToast("error", "Please select a color variant.");
        setIsSubmitting(false);
        return;
      }
      if (!govIdFile) {
        showToast("error", "Please upload a valid Government ID image.");
        setIsSubmitting(false);
        return;
      }

      const start = new Date(formData.pickupDate);
      const end = new Date(formData.returnDate);
      if (!(formData.pickupDate && formData.returnDate) || end < start) {
        showToast("error", "Please set a valid rental date range.");
        setIsSubmitting(false);
        return;
      }

      // Check if any date in range is booked
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = new Date(d).toISOString().split('T')[0];
        if (isDateBooked(dateStr)) {
          showToast("error", "Selected dates are already booked. Please choose different dates.");
          setIsSubmitting(false);
          return;
        }
      }

      const fileName = `${Date.now()}_${govIdFile.name}`;
      const { error: uploadError } = await supabase.storage.from("gov_ids").upload(fileName, govIdFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("gov_ids").getPublicUrl(fileName);
      const govIdUrl = urlData?.publicUrl || "";

      const bookingRow = {
        vehicle_id: selectedCar.id,
        vehicle_variant_id: formData.vehicleVariantId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        rental_start_date: formData.pickupDate,
        rental_end_date: formData.returnDate,
        pickup_location: formData.pickupLocation,
        license_number: formData.licenseNumber,
        total_price: totalPrice,
        gov_id_url: govIdUrl,
        status: "pending",
      };

      const { data: insertedBooking, error: insertError } = await supabase
        .from("bookings")
        .insert([bookingRow])
        .select()
        .single();
      
      if (insertError) throw insertError;

      try {
        const emailData = {
          customer_email: formData.email,
          customer_name: formData.fullName,
          bookingId: insertedBooking.id,
          vehicleMake: selectedCar.make,
          vehicleModel: selectedCar.model,
          vehicleYear: selectedCar.year,
          variantColor: selectedVariant?.color,
          rental_start_date: formData.pickupDate,
          rental_end_date: formData.returnDate,
          pickup_location: formData.pickupLocation,
          total_price: totalPrice
        };

        const emailResponse = await fetch('http://localhost:3001/api/send-booking-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          showToast("success", "Booking submitted and confirmation email sent!");
        } else {
          showToast("success", "Booking submitted! (Email notification may be delayed)");
        }
      } catch (emailError) {
        console.error("Email service error:", emailError);
        showToast("success", "Booking submitted! (Email notification may be delayed)");
      }

      await refreshBookings?.();
      await refreshVariants();
      setTimeout(() => onClose(), 1200);
      
    } catch (err) {
      console.error(err);
      showToast("error", "Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVariantSwatch = (variant) => {
    const colorName = variant.color.toLowerCase();
    let bgColor = '#e5e7eb';

    if (colorName.includes('white') || colorName.includes('pearl')) bgColor = '#ffffff';
    else if (colorName.includes('black') || colorName.includes('midnight')) bgColor = '#1f2937';
    else if (colorName.includes('silver') || colorName.includes('metallic')) bgColor = '#9ca3af';
    else if (colorName.includes('red')) bgColor = '#dc2626';
    else if (colorName.includes('blue')) bgColor = '#2563eb';
    else if (colorName.includes('gray') || colorName.includes('grey')) bgColor = '#6b7280';

    const isSelected = selectedVariant?.id === variant.id;

    return (
      <button
        key={variant.id}
        onClick={() => handleVariantSelect(variant)}
        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 min-w-[100px] hover:bg-gray-50 hover:shadow-md cursor-pointer border-gray-200 hover:border-gray-300 ${isSelected ? 'ring-3 ring-black ring-opacity-20 bg-gray-50 shadow-lg border-gray-400' : ''}`}
      >
        <div
          className={`w-12 h-12 rounded-full border-3 shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md ${bgColor === '#ffffff' ? 'border-gray-300' : 'border-gray-200'} ${isSelected ? 'scale-110 shadow-md' : ''}`}
          style={{ backgroundColor: bgColor }}
        />
        <div className="text-center">
          <span className={`text-sm font-semibold block ${isSelected ? 'text-black' : 'text-gray-700'}`}>
            {variant.color}
          </span>
          <span className="text-xs block mt-1 text-green-600">
            Available
          </span>
        </div>
      </button>
    );
  };

  if (!isOpen) return null;

  const displayCar = selectedCar || {
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    seats: 5,
    price_per_day: 3500,
    image_url: defaultBackground
  };

  return (
    <>
      <Toast {...toast} onClose={hideToast} />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            
            <div className="lg:w-2/5 bg-gray-50 pl-5 pr-5 flex flex-col">
              <div className="flex items-center justify-center mt-22.5">
                <div className="w-full h-80 lg:h-96 rounded-3xl shadow-lg flex items-center justify-center overflow-hidden border border-gray-100 relative">
                  <img
                    src={defaultBackground}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {selectedVariant?.image_url || displayCar?.image_url ? (
                    <img
                      src={selectedVariant?.image_url || displayCar?.image_url}
                      alt={`${displayCar?.make} ${displayCar?.model}`}
                      className="relative object-contain w-full h-full p-4 mt-25"
                    />
                  ) : null}
                </div>
              </div>

              <div className="text-center mt-5 ml-1 lg:text-left mb-2">
                <span className="text-sm text-gray-700 font-medium">Color:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {selectedVariant?.color || "Select a color"}
                </span>
              </div>

              <div className="flex gap-3 justify-center ml-1 lg:justify-start">
                {variants.map((variant) => {
                  const colorName = variant.color?.toLowerCase() || "";
                  let bgColor = "#e5e7eb";

                  if (colorName.includes("white") || colorName.includes("pearl"))
                    bgColor = "#ffffff";
                  else if (colorName.includes("black") || colorName.includes("midnight"))
                    bgColor = "#1f2937";
                  else if (colorName.includes("silver") || colorName.includes("metallic"))
                    bgColor = "#9ca3af";
                  else if (colorName.includes("red")) bgColor = "#fca5a5";
                  else if (colorName.includes("blue")) bgColor = "#2563eb";
                  else if (colorName.includes("beige")) bgColor = "#e5decf";
                  else if (colorName.includes("gold") || colorName.includes("brown"))
                    bgColor = "#d1a054";

                  const isSelected = selectedVariant?.id === variant.id;

                  return (
                    <div key={variant.id} className="relative">
                      <button
                        onClick={() => handleVariantSelect(variant)}
                        className={`w-5 h-5 rounded-full cursor-pointer
                          ${isSelected ? "ring-1 ring-gray-500" : ""}
                        `}
                        style={{
                          backgroundColor: bgColor,
                        }}
                        title={variant.color}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-center lg:text-left ml-1 text-black">
                <h3 className="text-3xl font-bold mb-3">
                  {displayCar?.make} {displayCar?.model}
                </h3>
                <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-black-900 mb-3">
                  <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full shadow">
                    <Calendar className="w-4 h-4 text-black" />
                    {displayCar?.year}
                  </span>
                  <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full shadow">
                    <IoPeopleOutline className="w-4 h-4 text-black" />
                    {displayCar?.seats} seats
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ₱{selectedVariant?.price_per_day?.toLocaleString() || displayCar?.price_per_day?.toLocaleString()}
                  <span className="text-lg font-normal text-black-900 ml-1">/day</span>
                </div>
              </div>
            </div>

            <div className="lg:w-3/5 pr-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl sm:text-3xl mt-8 font-bold text-gray-900 text-center flex-1">
                  Complete Your Booking
                </h2>
                <button
                  onClick={onClose}
                  className="ml-4 w-12 h-12 mt-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>
            
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-black" />
                    </div>
                    Personal Information
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">License Number *</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
                        placeholder="Enter your license number"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-black" />
                    </div>
                    Rental Details
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Date *</label>
                      <input
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        disabled={!selectedVariant}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {!selectedVariant && (
                        <p className="text-xs text-orange-600 mt-1">Please select a color first</p>
                      )}
                      {formData.pickupDate && isDateBooked(formData.pickupDate) && (
                        <p className="text-xs text-red-600 mt-1">This date is already booked</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Return Date *</label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleInputChange}
                        min={formData.pickupDate || new Date().toISOString().split("T")[0]}
                        required
                        disabled={!selectedVariant || !formData.pickupDate}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {!formData.pickupDate && selectedVariant && (
                        <p className="text-xs text-orange-600 mt-1">Please select pickup date first</p>
                      )}
                      {formData.returnDate && isDateBooked(formData.returnDate) && (
                        <p className="text-xs text-red-600 mt-1">This date is already booked</p>
                      )}
                    </div>
                  </div>
                  {bookedDates.length > 0 && selectedVariant && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Some dates are unavailable for the selected color. Please choose dates that are not already booked.
                      </p>
                    </div>
                  )}
                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location *</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={formData.pickupLocation}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
                      placeholder="Enter pickup location"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-black" />
                    </div>
                    Identity Verification
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Government ID *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-500 hover:bg-gray-50 transition-all duration-300 bg-white/50">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="govId"
                      />
                      <label htmlFor="govId" className="cursor-pointer block">
                        {govIdPreview ? (
                          <img
                            src={govIdPreview}
                            alt="ID Preview"
                            className="mx-auto mb-4 max-h-40 rounded-2xl object-contain shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-black" />
                          </div>
                        )}
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {govIdPreview ? "Click to change your ID" : "Click to upload your ID"}
                        </p>
                        <p className="text-sm text-gray-500">JPEG or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-100 p-6 rounded-2xl border border-gray-200">
                  <div>
                    <div className="text-xl text-gray-600 font-semibold">
                      Total Price ({rentalDays} days)
                    </div>
                    <div className="text-4xl font-extrabold text-black mt-1">
                      ₱{totalPrice.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedVariant}
                    className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform
                      ${
                        isSubmitting || !selectedVariant
                          ? "bg-gray-400 text-gray-50 cursor-not-allowed opacity-60"
                          : "bg-black text-gray-50 cursor-pointer hover:bg-gray-800 shadow-lg hover:scale-105"
                      }`}
                  >
                    {isSubmitting ? "Submitting..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
/* ===========================
   Navbar
   =========================== */
   const Navbar = ({ onRentClick, scrollToSection, refs }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [active, setActive] = useState("home")
  
    const handleScroll = (ref, name) => {
      scrollToSection(ref)
      setActive(name)
      setIsOpen(false)
    }
  
    // 👇 Auto-update active state when scrolling
    useEffect(() => {
      const sections = [
        { name: "home", ref: refs.heroRef },
        { name: "about", ref: refs.aboutRef },
        { name: "cars", ref: refs.fleetRef },
        { name: "faqs", ref: refs.faqRef },
        { name: "contact", ref: refs.contactRef },
      ]
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const section = sections.find((s) => s.ref.current === entry.target)
              if (section) setActive(section.name)
            }
          })
        },
        { threshold: 0.5 } // 50% of section visible = active
      )
  
      sections.forEach((s) => {
        if (s.ref.current) observer.observe(s.ref.current)
      })
  
      return () => observer.disconnect()
    }, [refs])
  
    return (
      <nav className="bg-[#eff2f7] sticky top-0 z-50 ">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <img src={logo} alt="The Rental Den Logo" className="h-12 w-auto mr-2" />
              <span className="text-xl font-bold text-gray-900">The Rental Den</span>
            </div>
  
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              {[
                { name: "home", label: "HOME", ref: refs.heroRef },
                { name: "about", label: "ABOUT US", ref: refs.aboutRef },
                { name: "cars", label: "CARS", ref: refs.fleetRef },
                { name: "faqs", label: "FAQs", ref: refs.faqRef },
                { name: "contact", label: "CONTACT US", ref: refs.contactRef },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleScroll(item.ref, item.name)}
                  className={`font-medium transition-colors relative ${
                    active === item.name ? "text-black" : "text-gray-600 hover:text-black"
                  }`}
                >
                  {item.label}
                  {active === item.name && (
                    <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-black rounded" />
                  )}
                </button>
              ))}
  
              <button
                onClick={() => handleScroll(refs.fleetRef, "cars")}
                className="bg-black text-gray-50 px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-transform transform hover:scale-105 cursor-pointer"
              >
                Rent Now
              </button>
            </div>
  
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-700 hover:text-black">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
  
          {/* Mobile Drawer */}
          {isOpen && (
            <div className="md:hidden pb-4">
              <div className="space-y-2 pt-2">
                {[
                  { name: "home", label: "HOME", ref: refs.heroRef },
                  { name: "about", label: "ABOUT US", ref: refs.whyChooseUsRef },
                  { name: "cars", label: "CARS", ref: refs.fleetRef },
                  { name: "faqs", label: "FAQs", ref: refs.faqRef },
                  { name: "contact", label: "CONTACT US", ref: refs.contactRef },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleScroll(item.ref, item.name)}
                    className={`block w-full text-left font-medium ${
                      active === item.name ? "text-black" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
  
                <button
                  onClick={onRentClick}
                  className="w-full bg-black text-gray-50 px-6 py-3 font-medium hover:bg-gray-800 transition-transform transform hover:scale-105"
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
  
/* ===========================
   Hero
   =========================== */
const HeroSection = () => {
  const [loaded, setLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll)
    return () => {
      clearTimeout(t)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <>
      <div className="relative h-[1000px] bg-[#eff2f7]">
        <section className="bg-gradient-to-b w-full overflow-hidden absolute pt-20 pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 items-center">
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

              <div className="relative lg:-ml-25 z-50 w-[1100px] -mt-8 flex justify-center">
                <div
                  className="absolute inset-y-10 right-0 w-full rounded-full blur-3xl"
                  style={{
                    background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)",
                    transform: `translateX(${scrollY * 0.5}px)`,
                    zIndex: -1,
                  }}
                />
                <img
                  src={HeroPageCar2}
                  alt="hero-car"
                  className={`w-full max-w-4xl object-contain drop-shadow-2xl transition-all duration-1000 ease-out ${
                    loaded ? "scale-100 opacity-100" : "scale-75 opacity-0"
                  }`}
                  style={{ transform: `translateX(${scrollY * 0.3}px) scale(${loaded ? 1 : 0.75})` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${BackgroundImage})`, position: "absolute", top: "80px" }}
        />
      </div>
    </>
  )
}
/* ===========================
   About
   =========================== */
   const AboutSection = () => {
    return (
      <section className="py-20 bg-[#F0F5F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Car only */}
            <div className="flex justify-center items-center relative">
              <img
                src={faqscar1}
                alt="Car"
                className="
                  w-[600px] md:w-[800px] lg:w-[1000px] 
                  h-auto
                  -scale-x-100
                "
              />
            </div>
  
            {/* Text Content */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                About Rental Den
              </h2>
              <p className="text-gray-600 leading-relaxed">
              Welcome to The Rental Den – your trusted partner in car rentals. We offer a wide selection of vehicles, from budget-friendly compact cars to premium SUVs, with clear pricing and a smooth booking process.

Our mission is to make every journey comfortable, stress-free, and memorable. Each car in our fleet is regularly maintained to ensure safety and reliability, giving you peace of mind on the road.

What makes us different is our local expertise and friendly support. Whether you’re exploring Cebu for leisure, traveling with family, or here for business, our team is ready to provide personalized assistance to match your needs.

At The Rental Den, it’s more than just renting cars – it’s about helping you travel with confidence and create lasting experiences.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  /* ===========================
     Why Choose Us
     =========================== */
  const WhyChooseUs = () => {
    const features = [
      {
        icon: <img src={carIcon} alt="Car Icon" className="h-10 w-10 object-contain" />,
        title: "Quality Vehicles",
        description:
          "We maintain our fleet to the highest standards so you can enjoy a safe and smooth ride every time.",
      },
      {
        icon: <img src={calendarIcon} alt="Calendar Icon" className="h-10 w-10 object-contain" />,
        title: "Seamless Booking Experience",
        description: "Simple, fast, and user-friendly. Book your car online in minutes, with instant confirmation.",
      },
      {
        icon: <img src={supportIcon} alt="Support Icon" className="h-10 w-10 object-contain" />,
        title: "Local Expertise & Friendly Support",
        description:
          "Our Cebu-based team is here to help with travel tips, car pick-up, and customer support whenever you need it.",
      },
    ]
  
    return (
      <section className="py-20 mb-15 bg-[#F0F5F8] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Enjoy a hassle-free ride with reliable cars, fast booking, and friendly support trusted by locals and tourists
            alike.
          </p>
  
          {/* Connector line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-[120px] hidden md:block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 600 200"
              className="w-[1200px] h-[260px] text-gray-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="0"
            >
              <path
                d="M 0 150 Q 150 50, 300 150 T 600 150"
                stroke="currentColor"
                strokeWidth="1"
                fill="transparent"
              />
            </svg>
          </div>
  
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                {/* Icon inside rounded square */}
                <div className="bg-[#101010] text-white rounded-lg p-6 flex items-center justify-center mb-8 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  
  
/* ===========================
   How It Works
   =========================== */
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
    ];
  
    return (
      <section className="relative w-full  overflow-hidden border-t border-b border-gray-900">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-[#F0F5F8] text-gray-900 py-10 lg:py-12 px-6 md:px-8 lg:pl-12 xl:pl-16 lg:pr-6 flex flex-col">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-center ">
              How It Works
            </h2>
            <div className="space-y-8">
              {steps.map((s) => (
                <div key={s.number} className="flex items-start">
                  <span className="text-4xl font-bold leading-none mr-4 w-12">{s.number}</span>
                  <div>
                    <h3 className="text-lg mt-3 lg:text-xl font-semibold mb-1">{s.title}</h3>
                    <p className="text-gray-900 leading-snug">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <div className="relative h-96 lg:h-auto">
            <img
              src={aboutcra}
              alt="Car side mirror"
              className="absolute top-0 right-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    );
  };

  const CarCard = ({ car, onRentClick, onOpenDetails }) => {
    const [variantStats, setVariantStats] = useState({
      totalAvailable: 0,
      totalQuantity: 0,
      hasVariants: false,
      variantCount: 0,
      variants: [],
      pricePerDay: 0
    })
    const [isLoading, setIsLoading] = useState(true)
  
    useEffect(() => {
      const fetchVariantAvailability = async () => {
        if (!car?.id) return
        setIsLoading(true)
  
        try {
          const { data: variants, error } = await supabase
            .from("vehicle_variants")
            .select("id, color, total_quantity, available_quantity, price_per_day, created_at")
            .eq("vehicle_id", car.id)
            .order("created_at", { ascending: true })
  
          if (error) {
            console.error("Error fetching variants:", error)
            setVariantStats({
              totalAvailable: car.available_quantity || 0,
              totalQuantity: car.total_quantity || 0,
              hasVariants: false,
              variantCount: 0,
              variants: [],
              pricePerDay: car.price_per_day || 0
            })
          } else if (variants && variants.length > 0) {
            const totalAvailable = variants.reduce(
              (sum, variant) => sum + (variant.available_quantity || 0),
              0
            )
            const totalQuantity = variants.reduce(
              (sum, variant) => sum + (variant.total_quantity || 0),
              0
            )
            const firstVariantPrice = variants[0]?.price_per_day || 0
            
            setVariantStats({
              totalAvailable,
              totalQuantity,
              hasVariants: true,
              variantCount: variants.length,
              variants,
              pricePerDay: firstVariantPrice
            })
          } else {
            setVariantStats({
              totalAvailable: car.available_quantity || 0,
              totalQuantity: car.total_quantity || 0,
              hasVariants: false,
              variantCount: 0,
              variants: [],
              pricePerDay: car.price_per_day || 0
            })
          }
        } catch (error) {
          console.error("Error in fetchVariantAvailability:", error)
          setVariantStats({
            totalAvailable: car.available_quantity || 0,
            totalQuantity: car.total_quantity || 0,
            hasVariants: false,
            variantCount: 0,
            variants: [],
            pricePerDay: car.price_per_day || 0
          })
        } finally {
          setIsLoading(false)
        }
      }
  
      fetchVariantAvailability()
    }, [car?.id, car.available_quantity, car.total_quantity, car.price_per_day])
  
    return (
      <div
        className="w-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
        onClick={() => onOpenDetails(car)}
      >
        <div className="relative h-60 w-full bg-gray-100">
          <img
            src={defaultBackground}
            alt="Default background"
            className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
          />
          <img
            src={car.image_url || defaultBackground}
            alt={`${car.make} ${car.model}`}
            loading="lazy"
            className="relative w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        </div>
  
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
            {car.model}
          </h3>
          <p className="text-m text-gray-600 truncate">
            {car.make} • {car.year}
          </p>
  
          <div className="flex items-center justify-between mt-3 mb-4 text-xs text-gray-700">
            <div className="flex items-center gap-1">
              <IoSpeedometerOutline className="h-4 w-4 text-gray-500" />
              <span>
                {car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IoPeopleOutline className="h-4 w-4 text-gray-500" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-1">
              <IoCarOutline className="h-4 w-4 text-gray-500" />
              <span>{car.type}</span>
            </div>
          </div>
  
          <div className="mb-4">
            <div className="text-lg font-semibold text-black">₱{car.price_per_day}/day</div>
            <div className="text-xs text-gray-500 mt-1">
              {isLoading ? (
                <span className="animate-pulse">Loading availability...</span>
              ) : variantStats.hasVariants && variantStats.variants.length > 0 ? (
                <>
                  <div className="text-gray-400 mb-1">Colors available:</div>
                  {variantStats.variants.slice(0, 2).map((variant) => (
                    <div key={variant.id} className="flex justify-between text-xs">
                      <span className="capitalize">{variant.color}</span>
                      <span className="font-semibold text-green-600">Available</span>
                    </div>
                  ))}
                  {variantStats.variantCount > 2 && (
                    <div className="text-xs text-gray-400">
                      +{variantStats.variantCount - 2} more colors
                    </div>
                  )}
                </>
              ) : (
                <>Multiple colors available</>
              )}
            </div>
          </div>
  
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRentClick(car)
              }}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Rent Now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetails?.(car)
              }}
              className="flex-1 py-2 px-4 border text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    )
  }
/* ===========================
   Fleet Section - UPDATED VERSION
   =========================== */
 
   const FleetSection = ({ onRentClick, onOpenDetails }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState(["All"]);
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
  
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("type")
          .not("type", "is", null);
        
        if (error) throw error;
        
        const uniqueTypes = [...new Set(data.map(vehicle => vehicle.type))];
        setCategories(["All", ...uniqueTypes]);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories(["All", "Sedan", "SUV", "Luxury"]);
      }
    };
  
    useEffect(() => {
      const fetchData = async () => {
        await fetchCategories();
        fetchVehicles();
      };
      fetchData();
    }, []);
  
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("vehicles")
          .select(`
            *,
            vehicle_variants ( available_quantity )
          `)
          .order("created_at", { ascending: false });
        if (error) throw error;
  
        const enriched = (data || []).map((v) => {
          const variants = v.vehicle_variants || [];
          const totalAvailable = variants.reduce(
            (sum, vv) => sum + (vv.available_quantity || 0),
            0
          );
          return {
            ...v,
            available: totalAvailable > 0,
            available_quantity: totalAvailable,
            total_quantity: variants.length,
          };
        });
  
        setVehicles(enriched);
        setFilteredVehicles(enriched);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    const handleCategoryClick = (category) => {
      setActiveCategory(category);
      setMenuOpen(false);
      if (category === "All") {
        setFilteredVehicles(vehicles);
      } else {
        setFilteredVehicles(vehicles.filter((v) => v.type === category));
      }
    };
  
    return (
      <section className="py-20 mt-10 bg-[#F0F5F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Explore Our Fleet
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find the perfect car for your needs with our special rental offers.
              We provide a wide selection of vehicles, easy booking, and
              exceptional value for your next journey.
            </p>
          </div>
  
          {/* Category Tabs */}
          <div className="mb-12 relative max-w-4xl mx-auto">
            {/* Left Arrow */}
            <button
              onClick={() => {
                document.getElementById("categoryScroll").scrollBy({ left: -250, behavior: "smooth" })
              }}
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
  
            {/* Category List (centered + scrollable) */}
            <div
              id="categoryScroll"
              className="hidden md:flex overflow-x-hidden gap-10 px-15 justify-center scroll-smooth"
              style={{ scrollBehavior: "smooth" }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`pb-2 font-semibold text-lg whitespace-nowrap relative ${
                    activeCategory === cat ? "text-black" : "text-gray-500"
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <span className="absolute left-0 bottom-0 w-full h-[2px] bg-black rounded"></span>
                  )}
                </button>
              ))}
            </div>
  
            {/* Right Arrow */}
            <button
              onClick={() => {
                document.getElementById("categoryScroll").scrollBy({ left: 250, behavior: "smooth" })
              }}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-gray-50 shadow-md p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
  
            {/* Mobile Burger */}
            <div className="md:hidden flex">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-gray-50 shadow px-4 py-2 rounded-lg"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                <span className="font-semibold">{activeCategory}</span>
              </button>
            </div>
  
            {/* Mobile Dropdown */}
            {menuOpen && (
              <div className="md:hidden mt-4 bg-white shadow-lg rounded-lg p-4 space-y-2 text-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`block w-full py-2 font-semibold rounded ${
                      activeCategory === cat
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
  
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-gray-600">Loading vehicles...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-red-600">
                Error loading vehicles: {error}
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-gray-600">
                No vehicles available in this category.
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">
                {filteredVehicles.slice(0, 6).map((vehicle) => (
                  <CarCard
                    key={vehicle.id}
                    car={vehicle}
                    onRentClick={onRentClick}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
  
              {/* See More Button - Always show if there are any vehicles */}
              {filteredVehicles.length > 0 && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => navigate('/cars')}
                    className="bg-[#101010] text-gray-50 px-6 py-3 rounded-full font-medium text-sm hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-md"
                  >
                    See More Cars
                  </button>
                </div>
              )}

            </>
          )}
        </div>
      </section>
    );
  };
const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "What do I need to rent a car?",
      answer:
        "You’ll need a valid driver’s license, a government-issued ID, and a credit or debit card for the security deposit.",
    },
    {
      question: "Can I extend my rental period?",
      answer:
        "Yes, extensions are possible if the vehicle is still available. Just contact us before your booking ends to arrange it.",
    },
    {
      question: "Is insurance included in the rental?",
      answer:
        "All rentals come with basic insurance coverage. You can also upgrade to full coverage for extra protection.",
    },
    {
      question: "Do you offer delivery and pickup services?",
      answer:
        "Yes, we can deliver the car to your preferred location or you can pick it up from one of our designated offices.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept major credit cards, debit cards, and secure online payments. Cash payments may be available at selected branches.",
    },
  ]

  const toggleFAQ = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section
      className="
        relative 
        px-6 md:px-10 lg:px-20 
        py-10 sm:py-14 md:py-16 lg:py-20 
        text-gray-900
      "
      style={{
        backgroundImage: `url(${aboutcircle})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        {/* Left Side - FAQs */}
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Your Common Queries <span className="underline decoration-gray-900">Answered</span> <br />
            with Additional FAQs
          </h2>
          <p className="text-gray-900 mb-8">
            Got questions? We’ve compiled answers to help make your rental experience smooth and hassle-free.
          </p>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className=" rounded-lg p-4 cursor-pointer bg-white/90 text-gray-900 shadow-sm"
                onClick={() => toggleFAQ(i)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-700" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-700" />
                  )}
                </div>
                {openIndex === i && (
                  <p className="text-gray-700 mt-3 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Extra Image on top of background */}
        <div className="relative">
        <img
        src={faqscar1}
        alt="Customer Support"
        className="
          rounded-lg 
          w-full h-full object-cover 
          mt-10 sm:mt-16 md:mt-24 lg:mt-40
        "
      />
        </div>
      </div>
    </section>
  )
}

  const ContactUs = () => {
    return (
      <section className="relative py-20 px-6 md:px-10 lg:px-20 text-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold">Contact Us</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            We’d love to hear from you. Get in touch for inquiries, bookings, or support — our team is always ready to help.
            </p>
          </div>
  
          {/* Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Map */}
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-md">
              <iframe
                title="Rental Den Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62808.5234949729!2d123.8665!3d10.3157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9991b55555555%3A0xaaaaaaaaaaaaaaa!2sCebu%20City!5e0!3m2!1sen!2sph!4v1694700000000!5m2!1sen!2sph"
                width="100%"
                height="400"
                style={{ border: 0, filter: "grayscale(100%)" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
  
            {/* Right: Contact Details */}
            <div>
              <h3 className="text-2xl font-semibold mb-4">Contact Details</h3>
              <p className="text-gray-600 mb-8">
              Here’s how you can reach us. Contact us by phone, email, or visit our office — whichever works best for you.
              </p>
  
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Address */}
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg shadow">
                  <div className="p-3 rounded-md" style={{ backgroundColor: "#101010" }}>
                    <MapPin className="h-6 w-6 text-gray-50" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-gray-600 text-sm">Cebu City, Philippines</p>
                  </div>
                </div>
  
                {/* Mobile */}
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg shadow">
                  <div className="p-3 rounded-md" style={{ backgroundColor: "#101010" }}>
                    <Phone className="h-6 w-6 text-gray-50" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Mobile</h4>
                    <p className="text-gray-600 text-sm">+63 900 000 0000</p>
                  </div>
                </div>
  
                {/* Availability */}
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg shadow">
                  <div className="p-3 rounded-md" style={{ backgroundColor: "#101010" }}>
                    <Clock className="h-6 w-6 text-gray-50" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Availability</h4>
                    <p className="text-gray-600 text-sm">Daily 09 am – 05 pm</p>
                  </div>
                </div>
  
                {/* Email */}
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg shadow">
                  <div className="p-3 rounded-md" style={{ backgroundColor: "#101010" }}>
                    <Mail className="h-6 w-6 text-gray-50" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-gray-600 text-sm">hello@rentalden.com</p>
                  </div>
                </div>
              </div>
  
             {/* Social Media */}
              <div className="mt-10 flex items-center justify-between">
                <h4 className="font-semibold">Social Media:</h4>
                <div className="flex space-x-2">
                  <a
                    href="https://www.facebook.com/profile.php?id=61572309459200&_rdc=1&_rdr#"
                    target="_blank"
                    className="w-7 h-7 flex items-center justify-center rounded-md"
                    style={{ backgroundColor: "#101010" }}
                  >
                    <FaFacebookF size={12} className="text-gray-50" />
                  </a>
                 
                  <a
                    href="#"
                    className="w-7 h-7 flex items-center justify-center rounded-md"
                    style={{ backgroundColor: "#101010" }}
                  >
                    <FaInstagram size={12} className="text-gray-50" />
                  </a>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const Footer = () => {
    return (
      <footer className="bg-[#101010] text-gray-300 py-12 px-6 md:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <p className="mb-2">Cebu City, Philippines</p>
            <p className="mb-4">+63 900 000 0000</p>
            <div className="flex space-x-3">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 transition">
                <FaFacebookF size={14} />
              </a>
             
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 transition">
                <FaInstagram size={14} />
              </a>
           
            </div>
          </div>
  
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-white">Home</a></li>
              <li><a href="#about" className="hover:text-white">About Us</a></li>
              <li><a href="#cars" className="hover:text-white">Cars</a></li>
              <li><a href="#FAQs" className="hover:text-white">FAQs</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
  
    
        </div>
  
        {/* Bottom Bar */}
        <div className="mt-10 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} The Rental Den. All Rights Reserved.
        </div>
      </footer>
    )
  }
/* ===========================
   Main App
   =========================== */  
  
  const App = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCar, setSelectedCar] = useState(null)
    const [bookings, setBookings] = useState([]) // 🆕 show active bookings for cancel
  
    // sections refs
    const heroRef = useRef(null)
    const aboutRef = useRef(null)
    const whyChooseUsRef = useRef(null)
    const fleetRef = useRef(null)
    const faqRef = useRef(null)
    const contactRef = useRef(null)
    const FooterRef = useRef(null) // renamed to FooterRef so it won’t conflict with component
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isRentalOpen, setIsRentalOpen] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState(null)
  
    const handleOpenDetails = (car) => {
      setSelectedCar(car)
      setSelectedVariant(null)
      setIsDetailsOpen(true)
    }
  
    const fetchBookings = async () => {
      // 🆕 only confirmed bookings
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .order("id", { ascending: false })
      if (!error) setBookings(data || [])
    }
    useEffect(() => {
      fetchBookings()
    }, [])
  
    const handleRentClick = (car, variant = null) => {
      setSelectedCar(car)
      setSelectedVariant(variant)
      setIsDetailsOpen(false) // if coming from details, close it
      setIsRentalOpen(true) // always open rental form
    }
  
    const handleCloseModal = () => {
      setIsModalOpen(false)
      setSelectedCar(null)
    }
    const scrollToSection = (ref) =>
      ref.current?.scrollIntoView({ behavior: "smooth" })
  
    return (
      <div className="min-h-screen bg-[#F0F5F8] flex flex-col">
        <Navbar
          onRentClick={() => handleRentClick()}
          scrollToSection={scrollToSection}
          refs={{
            heroRef,
            aboutRef,
            whyChooseUsRef,
            fleetRef,
            faqRef,
            contactRef,
          }}
        />
  
        <div ref={heroRef} id="home">
          <HeroSection />
        </div>
        
        <div ref={aboutRef} id="about">
          <AboutSection />
          <div ref={whyChooseUsRef}>
            <WhyChooseUs />
          </div>
        </div>
        
        <HowItWorks />
        
        <div ref={fleetRef} id="cars">
          <FleetSection
            onOpenDetails={handleOpenDetails}
            onRentClick={handleRentClick}
          />
        </div>
  
        <DetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          car={selectedCar}
          onRentClick={handleRentClick}
        />
        <RentalBot />
  
        <RentalModal
          isOpen={isRentalOpen}
          onClose={() => setIsRentalOpen(false)}
          selectedCar={selectedCar}
          selectedVariant={selectedVariant}
        />
  
        <div ref={faqRef} id="faqs">
          <FAQs />
        </div>
        
        <div ref={contactRef} id="contact">
          <ContactUs />
        </div>
  
        <div ref={FooterRef}>
          <Footer />
        </div>
  
        <style>{`
          @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slide-in 0.3s ease-out; }
        `}</style>
      </div>
    )
  }
  
  export default App
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
import carabout from "./assets/carabout.jpg"
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
   ✅ Intersection Observer Hook for Animations
   =========================== */
const useScrollAnimation = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true) // Never resets
        }
        
        // AFTER: Animation triggers every time
        setIsVisible(entry.isIntersecting) 
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  return [setRef, isVisible]
}

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
  const [variantStats, setVariantStats] = useState({});
  const [colorGroups, setColorGroups] = useState([]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchVariants = async () => {
        if (!car?.id) return;
        
        // Fetch variants
        const { data: variantsData, error: varError } = await supabase
          .from("vehicle_variants")
          .select("*")
          .eq("vehicle_id", car.id);
        
        if (varError) {
          console.error('Error fetching variants:', varError);
          return;
        }
  
        // Fetch current bookings
        const today = new Date().toISOString().split('T')[0];
        const { data: bookings, error: bookError } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "confirmed")
          .gte("rental_end_date", today)
          .lte("rental_start_date", today);
  
        if (bookError) {
          console.error('Error fetching bookings:', bookError);
        }
  
        // Calculate stats for each individual variant
        const stats = {};
        variantsData.forEach(variant => {
          const isRented = bookings?.some(b => b.vehicle_variant_id === variant.id);
          stats[variant.id] = {
            isAvailable: variant.is_available && !isRented,
            isRented: isRented,
            isMaintenance: !variant.is_available
          };
        });
  
        // FIXED: Group by unique color names (case-insensitive)
        const groups = {};
        variantsData.forEach(variant => {
          const colorKey = variant.color.toLowerCase().trim();
          if (!groups[colorKey]) {
            groups[colorKey] = {
              color: variant.color, // Keep original casing for display
              variants: []
            };
          }
          groups[colorKey].variants.push(variant);
        });
  
        setVariants(variantsData || []);
        setVariantStats(stats);
        setColorGroups(Object.values(groups));
        
        // Select first available variant
        const firstAvailable = variantsData.find(v => stats[v.id]?.isAvailable);
        setSelectedVariant(firstAvailable || variantsData[0]);
      };
      
      if (isOpen) fetchVariants();
    }, [isOpen, car]);
  
    if (!isOpen || !car) return null;
  
    // Helper function to get color hex code
    const getColorHex = (colorName) => {
      const name = colorName.toLowerCase();
      if (name.includes("white") || name.includes("pearl")) return "#ffffff";
      if (name.includes("black") || name.includes("midnight")) return "#1f2937";
      if (name.includes("silver") || name.includes("metallic")) return "#9ca3af";
      if (name.includes("red")) return "#dc2626";
      if (name.includes("blue")) return "#2563eb";
      if (name.includes("gray") || name.includes("grey")) return "#6b7280";
      if (name.includes("green")) return "#16a34a";
      if (name.includes("yellow") || name.includes("gold")) return "#facc15";
      if (name.includes("orange")) return "#f97316";
      if (name.includes("brown")) return "#7c4a31";
      if (name.includes("purple")) return "#8b5cf6";
      if (name.includes("pink")) return "#ec4899";
      if (name.includes("beige")) return "#e5decf";
      return "#e5e7eb";
    };
  
    // FIXED: Render unique color groups with badges
    const renderColorSwatch = (colorGroup) => {
      const bgColor = getColorHex(colorGroup.color);
      
      // Calculate availability for this color group
      const availableCount = colorGroup.variants.filter(v => variantStats[v.id]?.isAvailable).length;
      const totalCount = colorGroup.variants.length;
      const hasAvailable = availableCount > 0;
      
      // Check if any variant of this color is currently selected
      const isSelected = colorGroup.variants.some(v => v.id === selectedVariant?.id);
  
      return (
        <button
          key={colorGroup.color}
          onClick={() => {
            // Smart selection: pick first available variant of this color
            // If none available, pick first variant anyway (for display)
            const firstAvailable = colorGroup.variants.find(v => variantStats[v.id]?.isAvailable);
            setSelectedVariant(firstAvailable || colorGroup.variants[0]);
          }}
          disabled={!hasAvailable}
          className={`rounded-full transition-all duration-200 relative
            ${isSelected ? "w-7 h-7 sm:w-8 sm:h-8 scale-110 sm:scale-125 shadow-md" : "w-5 h-5 sm:w-6 sm:h-6"}
            ${!hasAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-110"}
          `}
          style={{
            backgroundColor: bgColor,
            border: bgColor === "#ffffff" ? "1px solid #e5e7eb" : "none",
          }}
          title={`${colorGroup.color} - ${availableCount}/${totalCount} available`}
        >
          {/* Unavailable indicator (red dot) */}
          {!hasAvailable && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full border border-white" />
          )}
          
          {/* Count badge (shows number of units with this color) */}
          {totalCount > 1 && (
            <span className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-900 text-white text-[7px] sm:text-[8px] rounded-full flex items-center justify-center font-bold border border-white">
              {totalCount}
            </span>
          )}
        </button>
      );
    };
  
    const stats = variantStats[selectedVariant?.id] || {};
  
    // FIXED: Calculate statistics for each unique color (not individual variants)
    const colorGroupStats = colorGroups.map(group => ({
      color: group.color,
      total: group.variants.length,
      available: group.variants.filter(v => variantStats[v.id]?.isAvailable).length,
      rented: group.variants.filter(v => variantStats[v.id]?.isRented).length,
      maintenance: group.variants.filter(v => variantStats[v.id]?.isMaintenance).length
    }));
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
        <div className="bg-gray-50 rounded-2xl sm:rounded-3xl w-full h-[95vh] sm:max-w-6xl sm:h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* MOBILE: Single scrollable container */}
          <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT SIDE - Car Image */}
            <div
              className="relative lg:w-3/5 w-full flex flex-col items-center justify-center p-6 sm:p-8 bg-cover bg-center min-h-[350px] sm:min-h-[400px] lg:min-h-0"
              style={{
                backgroundImage: `url(${defaultBackground})`,
              }}
            >
              {/* Close Button - Mobile: Top right of image | Desktop: Moved to details section */}
              <button
                onClick={onClose}
                className="lg:hidden absolute top-4 right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-200 shadow-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* ===== CAR IMAGE CONTAINER - CENTERED FOR MOBILE ===== */}
              {/* Mobile: Vertically and horizontally centered */}
              {/* Desktop: Positioned with scale and margin adjustments */}
              {/* Adjust mt-10 value to move car up/down on mobile */}
              <div className="relative w-full flex items-center justify-center flex-1 mt-10 lg:mt-0 lg:max-w-2xl">
                <img
                  src={selectedVariant?.image_url || car.image_url || defaultBackground}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-auto object-contain drop-shadow-2xl 
                    max-h-[280px] sm:max-h-[320px] 
                    lg:max-h-none lg:w-[600px] lg:scale-110 lg:mt-20"
                />
              </div>
              {/* ===== END CAR IMAGE CONTAINER ===== */}
              
              {/* Color Selector - Fixed at bottom with more spacing from car */}
              <div className="absolute bottom-3 sm:bottom-5 lg:bottom-5 left-1/2 -translate-x-1/2 w-auto">
                <div className="flex gap-1.5 sm:gap-2 lg:gap-4 bg-white/10 backdrop-blur-md px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg">
                  {colorGroups.map(renderColorSwatch)}
                </div>
              </div>
            </div>
    
            {/* RIGHT SIDE - Car Details */}
            <div className="relative lg:w-2/5 w-full flex flex-col p-4 sm:p-6 lg:p-8 lg:overflow-y-auto">
              
              {/* Close Button - Desktop only: Inside white details section */}
              <button
                onClick={onClose}
                className="hidden lg:flex absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Vehicle Title */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                  {car.model}
                </h1>
                <h2 className="text-lg sm:text-xl font-light text-gray-700">
                  {car.make}
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium text-gray-600 ml-2">
                    {car.year}
                  </span>
                </h2>
              </div>
    
              {/* Vehicle Specifications */}
              <div className="flex flex-wrap gap-3 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <IoSpeedometerOutline className="h-4 w-4 text-gray-500" />
                  <span>
                    {car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IoPeopleOutline className="h-4 w-4 text-gray-500" />
                  <span>{car.seats} Seater</span>
                </div>
                <div className="flex items-center gap-2">
                  <IoCarOutline className="h-4 w-4 text-gray-500" />
                  <span>{car.type || "N/A"}</span>
                </div>
              </div>
    
              {/* Price */}
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                ₱{selectedVariant?.price_per_day?.toLocaleString() || car.price_per_day?.toLocaleString()}
                <span className="text-base sm:text-lg font-normal text-gray-500">/day</span>
              </div>
    
              {/* Description */}
              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {car.description ||
                    "Experience luxury and performance with this premium vehicle. Perfect for business trips, special occasions, or when you simply want to enjoy the finest driving experience."}
                </p>
              </div>
    
              {/* Selected Variant Info with Status */}
              {selectedVariant && (
                <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl ${
                  stats.isAvailable ? 'bg-green-50 border border-green-200' :
                  stats.isRented ? 'bg-orange-50 border border-orange-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">Selected Color</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900">{selectedVariant.color}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Plate: {selectedVariant.plate_number}
                      </div>
                    </div>
                    <div className="text-right">
                      {stats.isAvailable ? (
                        <>
                          <div className="text-xs sm:text-sm text-green-600 font-semibold">✓ Available</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Book your dates</div>
                        </>
                      ) : stats.isRented ? (
                        <>
                          <div className="text-xs sm:text-sm text-orange-600 font-semibold">Currently Rented</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Check other colors</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs sm:text-sm text-red-600 font-semibold">⚠ Maintenance</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Temporarily unavailable</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
    
              {/* Color Availability Summary */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-100 rounded-xl">
                <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">All Available Colors:</div>
                <div className="space-y-2">
                  {colorGroupStats.map((stat) => (
                    <div key={stat.color} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium text-gray-700">{stat.color}</span>
                      <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs">
                        {stat.total > 1 && (
                          <span className="text-gray-500">{stat.total} units</span>
                        )}
                        {stat.available > 0 && (
                          <span className="text-green-600 font-semibold">{stat.available} available</span>
                        )}
                        {stat.rented > 0 && (
                          <span className="text-orange-600 font-semibold">{stat.rented} rented</span>
                        )}
                        {stat.maintenance > 0 && (
                          <span className="text-red-600 font-semibold">{stat.maintenance} maintenance</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
    
              {/* Rent Now Button */}
              <div className="mt-auto sticky bottom-0 bg-gray-50 pt-3 lg:pt-0 pb-2 lg:pb-0">
                <button
                  onClick={() => {
                    if (!stats.isAvailable) {
                      alert(stats.isRented 
                        ? 'This color is currently rented. Please select another color or check back later.' 
                        : 'This vehicle is under maintenance. Please select another color.');
                      return;
                    }
                    onClose();
                    onRentClick(car, selectedVariant);
                  }}
                  disabled={!stats.isAvailable}
                  className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-semibold shadow-lg transition-colors duration-200 ${
                    stats.isAvailable
                      ? 'bg-black text-gray-50 hover:bg-gray-800 hover:shadow-xl cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {stats.isAvailable ? 'Rent Now' : stats.isRented ? 'Currently Rented' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
 /* ===========================
   Rental Modal - FIXED
   =========================== */

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
  const [colorGroups, setColorGroups] = useState([]); // NEW: Store grouped colors
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
        
        // FIXED: Group variants by color (case-insensitive)
        const groups = {};
        data.forEach(variant => {
          const colorKey = variant.color.toLowerCase().trim();
          if (!groups[colorKey]) {
            groups[colorKey] = {
              color: variant.color, // Keep original casing
              variants: []
            };
          }
          groups[colorKey].variants.push(variant);
        });
        
        setColorGroups(Object.values(groups));
        
        // Select first available variant
        const firstVariant = data.find(v => v.is_available) || data[0];
        if (firstVariant) {
          setSelectedVariant(firstVariant);
          setFormData((s) => ({ ...s, vehicleVariantId: firstVariant.id }));
          fetchBookedDates(firstVariant.id);
        }
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
      setColorGroups([]);
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

  // FIXED: Select first available variant of chosen color
  const handleVariantSelect = (colorGroup) => {
    const firstAvailable = colorGroup.variants.find(v => v.is_available) || colorGroup.variants[0];
    setSelectedVariant(firstAvailable);
    setFormData((s) => ({ ...s, vehicleVariantId: firstAvailable?.id || "", pickupDate: "", returnDate: "" }));
    fetchBookedDates(firstAvailable?.id);
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
        showToast("error", "Please upload a valid Driver's License Card image.");
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

  const getColorHex = (colorName) => {
    const name = colorName.toLowerCase();
    if (name.includes('white') || name.includes('pearl')) return '#ffffff';
    if (name.includes('black') || name.includes('midnight')) return '#1f2937';
    if (name.includes('silver') || name.includes('metallic')) return '#9ca3af';
    if (name.includes('red')) return '#dc2626';
    if (name.includes('blue')) return '#2563eb';
    if (name.includes('gray') || name.includes('grey')) return '#6b7280';
    if (name.includes('green')) return '#16a34a';
    if (name.includes('yellow') || name.includes('gold')) return '#facc15';
    if (name.includes('orange')) return '#f97316';
    if (name.includes('brown')) return '#7c4a31';
    if (name.includes('beige')) return '#e5decf';
    if (name.includes('purple')) return '#8b5cf6';
    if (name.includes('pink')) return '#ec4899';
    return '#e5e7eb';
  };

  // FIXED: Render color groups instead of individual variants
  const renderColorGroupSwatch = (colorGroup) => {
    const colorName = colorGroup.color.toLowerCase();
    let bgColor = getColorHex(colorGroup.color);
    const availableCount = colorGroup.variants.filter(v => v.is_available).length;
    const totalCount = colorGroup.variants.length;

    // Check if this color group contains the selected variant
    const isSelected = colorGroup.variants.some(v => v.id === selectedVariant?.id);

    return (
      <div key={colorGroup.color} className="relative">
        <button
          onClick={() => handleVariantSelect(colorGroup)}
          disabled={availableCount === 0}
          className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-200
            ${isSelected ? "ring-2 ring-black ring-offset-2 scale-110" : ""}
            ${availableCount === 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-110"}
          `}
          style={{
            backgroundColor: bgColor,
            border: bgColor === '#ffffff' ? '1px solid #e5e7eb' : 'none',
          }}
          title={`${colorGroup.color} - ${availableCount}/${totalCount} available`}
        />
        {/* Show count badge if multiple units */}
        {totalCount > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[8px] rounded-full flex items-center justify-center font-bold border border-white">
            {totalCount}
          </span>
        )}
        {/* Show unavailable indicator */}
        {availableCount === 0 && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
        )}
      </div>
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
                {/* Show available count for selected color */}
                {selectedVariant && colorGroups.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({colorGroups.find(g => 
                      g.variants.some(v => v.id === selectedVariant.id)
                    )?.variants.filter(v => v.is_available).length || 0} available)
                  </span>
                )}
              </div>

              {/* FIXED: Display unique color groups with count badges */}
              <div className="flex gap-3 justify-center ml-1 lg:justify-start">
                {colorGroups.map(renderColorGroupSwatch)}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Upload Driver's License Card Image *</label>
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
      { name: "gallery", ref: refs.galleryRef }, // ✅ ADD THIS
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
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            {[
              { name: "home", label: "HOME", ref: refs.heroRef },
              { name: "about", label: "ABOUT US", ref: refs.aboutRef },
              { name: "cars", label: "CARS", ref: refs.fleetRef },
              { name: "faqs", label: "FAQs", ref: refs.faqRef },
                            { name: "gallery", label: "GALLERY", ref: refs.galleryRef }, // ✅ ADD THIS

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
                { name: "gallery", label: "GALLERY", ref: refs.galleryRef },
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
        <div className="relative h-[700px] sm:h-[800px] md:h-[900px] lg:h-[1000px] bg-[#eff2f7]">
          <section className="bg-gradient-to-b w-full overflow-hidden absolute pt-5 sm:pt-28 lg:pt-20 pb-20 sm:pb-32 lg:pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-0">
                <div className="lg:pr-16 mb-30 relative z-20">
                  <h1 className={`text-4xl sm:text-5xl md:text-6xl  lg:text-7xl font-bold text-gray-900 leading-tight  transition-all duration-1000 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}>
                    Find Your <br />
                    Perfect Ride <br />
                    Today
                  </h1>
                  <p className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-normal text-gray-700 leading-relaxed transition-all duration-1000 delay-300 ${
                    loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}>
                    From Comfort to Luxury, <br />
                    It's All in One Den
                  </p>
                </div>
  
                <div className="relative lg:-ml-25 mt-5 z-50 w-full lg:w-[1000px] flex justify-center lg:justify-end">
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
                    className={`w-full max-w-xl sm:max-w-3xl lg:max-w-4xl object-contain drop-shadow-2xl transition-all duration-1000 ease-out ${
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
            style={{ 
              backgroundImage: `url(${BackgroundImage})`, 
              position: "absolute", 
              backgroundPosition: "center top"
            }}
          />
        </div>
      </>
    )
  }
/* ===========================
   About - WITH ANIMATION (FADE UP FROM BOTTOM)
   =========================== */
   const AboutSection = () => {
    const [ref, isVisible] = useScrollAnimation(0.2)
    const [vehicleCount, setVehicleCount] = useState(0)
    const [availableVehicleCount, setAvailableVehicleCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState(null)
    
    // Animated counter states
    const [animatedHappyCustomers, setAnimatedHappyCustomers] = useState(0)
    const [animatedDailyBookings, setAnimatedDailyBookings] = useState(0)
    const [animatedVehicles, setAnimatedVehicles] = useState(0)
  
    // Fetch content from Supabase
    useEffect(() => {
      const fetchContent = async () => {
        try {
          const { data, error } = await supabase
            .from('website_content')
            .select('*')
            .eq('section', 'about_us')
            .single();
          
          if (error) throw error;
          setContent(data.content);
        } catch (err) {
          console.error('Error fetching about content:', err);
        }
      };
      
      fetchContent();
    }, []);
  
    useEffect(() => {
      const fetchVehicleStats = async () => {
        try {
          const { data: vehicles, error: vehicleError } = await supabase
            .from("vehicles")
            .select(`
              id,
              vehicle_variants (
                id,
                is_available
              )
            `)
          
          if (vehicleError) throw vehicleError
  
          const today = new Date().toISOString().split('T')[0]
          const { data: bookings, error: bookingError } = await supabase
            .from("bookings")
            .select("vehicle_variant_id")
            .eq("status", "confirmed")
            .gte("rental_end_date", today)
            .lte("rental_start_date", today)
  
          if (bookingError) throw bookingError
  
          const rentedVariantIds = new Set(bookings.map(b => b.vehicle_variant_id))
  
          const totalVehicles = vehicles?.length || 0
  
          let availableCount = 0
          vehicles?.forEach(vehicle => {
            const hasAvailableVariant = vehicle.vehicle_variants?.some(variant => 
              variant.is_available && !rentedVariantIds.has(variant.id)
            )
            if (hasAvailableVariant) {
              availableCount++
            }
          })
  
          setVehicleCount(totalVehicles)
          setAvailableVehicleCount(availableCount)
        } catch (error) {
          console.error("Error fetching vehicle stats:", error)
        } finally {
          setLoading(false)
        }
      }
  
      fetchVehicleStats()
    }, [])
  
    // Counting animation effect
    useEffect(() => {
      if (!isVisible || loading || !content) return
  
      const animateCount = (target, setter, duration = 2000) => {
        const increment = target / (duration / 16)
        let current = 0
  
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            setter(target)
            clearInterval(timer)
          } else {
            setter(Math.floor(current))
          }
        }, 16)
  
        return timer
      }
  
      const timer1 = animateCount(content.stats.happyCustomers, setAnimatedHappyCustomers)
      const timer2 = setTimeout(() => animateCount(content.stats.dailyBookings, setAnimatedDailyBookings), 200)
      const timer3 = setTimeout(() => animateCount(vehicleCount, setAnimatedVehicles), 400)
  
      return () => {
        clearInterval(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }, [isVisible, loading, vehicleCount, content])
  
    if (!content) return null;
  
    const stats = [
      { number: `${animatedHappyCustomers}+`, label: "Happy Customers" },
      { number: `${animatedDailyBookings}+`, label: "Daily Bookings" },
      { 
        number: loading ? "..." : `${animatedVehicles}+`, 
        label: "Total Vehicles",
        subLabel: loading ? "" : `(${availableVehicleCount} available)`
      }
    ]
  
    return (
      <section ref={ref} className="py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            
            <div 
              className={`relative min-h-[400px] lg:min-h-[550px] transition-all duration-1000 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <img
                src={carabout}
                alt="Rental Den Car"
                className="w-full h-130 object-cover rounded-2xl shadow-lg"
              />
            </div>
  
            <div 
              className={`p-8 sm:p-10 lg:p-12 flex flex-col justify-center rounded-2xl transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
              }`}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 mb-6">
                {content.title}
              </h2>
  
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-10">
                {content.description}
              </p>
  
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {stats.map((stat, idx) => (
                  <div 
                    key={idx}
                    className={`text-center transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${500 + (idx * 150)}ms` }}
                  >
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                    {stat.subLabel && (
                      <div className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-1">
                        {stat.subLabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
/* ===========================
   Why Choose Us - WITH ANIMATION
   =========================== */
const WhyChooseUs = () => {
  const [titleRef, titleVisible] = useScrollAnimation()
  const [card1Ref, card1Visible] = useScrollAnimation()
  const [card2Ref, card2Visible] = useScrollAnimation()
  const [card3Ref, card3Visible] = useScrollAnimation()

  const features = [
    {
      icon: <img src={carIcon} alt="Car Icon" className="h-10 w-10 object-contain" />,
      title: "Quality Vehicles",
      description: "We maintain our fleet to the highest standards so you can enjoy a safe and smooth ride every time.",
    },
    {
      icon: <img src={calendarIcon} alt="Calendar Icon" className="h-10 w-10 object-contain" />,
      title: "Seamless Booking Experience",
      description: "Simple, fast, and user-friendly. Book your car online in minutes, with instant confirmation.",
    },
    {
      icon: <img src={supportIcon} alt="Support Icon" className="h-10 w-10 object-contain" />,
      title: "Local Expertise & Friendly Support",
      description: "Our Cebu-based team is here to help with travel tips, car pick-up, and customer support whenever you need it.",
    },
  ]

  const refs = [card1Ref, card2Ref, card3Ref]
  const visibles = [card1Visible, card2Visible, card3Visible]

  // Check if all cards are visible
  const allCardsVisible = card1Visible && card2Visible && card3Visible

  return (
    <section className="py-20 bg-[#F0F5F8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div 
          ref={titleRef}
          className={`animate-on-scroll animate-fade-down ${titleVisible ? 'visible' : ''}`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Enjoy a hassle-free ride with reliable cars, fast booking, and friendly support trusted by locals and tourists alike.
          </p>
        </div>

        {/* Connector line - only shows when all cards are visible */}
        <div 
          className={`absolute left-1/2 transform -translate-x-1/2 top-[130px] hidden md:block pointer-events-none transition-all duration-1000 ${
            allCardsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 200"
            className="w-[1200px] h-[260px] text-gray-900"
            fill="none"
            stroke="currentColor"
          >
            {/* Animated path that draws in */}
            <path
              d="M 0 150 Q 150 50, 300 150 T 600 150"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray="2000"
              strokeDashoffset={allCardsVisible ? "0" : "2000"}
              className="transition-all duration-[2000ms] ease-in-out"
              style={{ 
                transitionDelay: allCardsVisible ? '300ms' : '0ms'
              }}
            />
            
       
          </svg>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative z-10">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={refs[index]}
              className={`flex flex-col items-center text-center animate-on-scroll animate-fade-up delay-${(index + 1) * 100} ${visibles[index] ? 'visible' : ''}`}
            >
              <div className="bg-[#101010] text-white rounded-lg p-6 flex items-center justify-center mb-8 shadow-md relative">
                {feature.icon}
                {/* Connection dot on top of icon box */}
                <div 
                />
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
   How It Works - WITH ANIMATION (FADE UP FROM BOTTOM)
   =========================== */
   const HowItWorks = () => {
    const [leftRef, leftVisible] = useScrollAnimation()
    const [rightRef, rightVisible] = useScrollAnimation()
    const [content, setContent] = useState(null)
  
    useEffect(() => {
      const fetchContent = async () => {
        try {
          const { data, error } = await supabase
            .from('website_content')
            .select('*')
            .eq('section', 'how_it_works')
            .single();
          
          if (error) throw error;
          setContent(data.content);
        } catch (err) {
          console.error('Error fetching how it works content:', err);
        }
      };
      
      fetchContent();
    }, []);
  
    if (!content) return null;
  
    return (
      <section ref={leftRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            
            <div 
              className={`bg-[#F0F5F8] p-8 sm:p-10 lg:p-12 flex flex-col justify-center rounded-2xl transition-all duration-1000 ${
                leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
              }`}
            >
              <h2 className={`text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 mb-8 transition-all duration-700 ${
                leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}>
                {content.title}
              </h2>
              <div className="space-y-8">
                {content.steps.map((step, idx) => (
                  <div 
                    key={step.number} 
                    className={`flex items-start transition-all duration-700 ${
                      leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${300 + (idx * 200)}ms` }}
                  >
                    <span className="text-4xl font-bold leading-none mr-4 w-12">{step.number}</span>
                    <div>
                      <h3 className="text-lg mt-3 lg:text-xl font-semibold mb-1">{step.title}</h3>
                      <p className="text-gray-900 leading-snug">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            <div 
              ref={rightRef}
              className={`relative min-h-[400px] lg:min-h-[550px] transition-all duration-1000 delay-300 ${
                rightVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <img
                src={aboutcra}
                alt="Car side mirror"
                className="w-full h-full object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };
const CarCard = ({ car, onRentClick, onOpenDetails, index }) => {
  const [colorStats, setColorStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardRef, cardVisible] = useScrollAnimation()

  useEffect(() => {
    const fetchVariantStats = async () => {
      if (!car?.id) return;
      setIsLoading(true);

      try {
        // Fetch variants
        const { data: variants, error: varError } = await supabase
          .from("vehicle_variants")
          .select("*")
          .eq("vehicle_id", car.id)
          .order("created_at", { ascending: true });

        if (varError) throw varError;

        // Fetch current bookings
        const today = new Date().toISOString().split('T')[0];
        const { data: bookings, error: bookError } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "confirmed")
          .gte("rental_end_date", today)
          .lte("rental_start_date", today);

        if (bookError) throw bookError;

        // FIXED: Group by unique color names (case-insensitive)
        const colorGroups = {};
        
        variants.forEach(variant => {
          const colorKey = variant.color.toLowerCase().trim();
          
          if (!colorGroups[colorKey]) {
            colorGroups[colorKey] = {
              color: variant.color, // Keep original casing
              total: 0,
              available: 0,
              rented: 0,
              unavailable: 0
            };
          }
          
          colorGroups[colorKey].total++;
          
          if (!variant.is_available) {
            colorGroups[colorKey].unavailable++;
          } else {
            const isRented = bookings?.some(b => b.vehicle_variant_id === variant.id);
            if (isRented) {
              colorGroups[colorKey].rented++;
            } else {
              colorGroups[colorKey].available++;
            }
          }
        });

        setColorStats(Object.values(colorGroups));
      } catch (error) {
        console.error("Error fetching variant stats:", error);
        setColorStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariantStats();
  }, [car?.id]);

  const getColorHex = (colorName) => {
    const name = colorName.toLowerCase();
    if (name.includes("white") || name.includes("pearl")) return "#ffffff";
    if (name.includes("black") || name.includes("midnight")) return "#1f2937";
    if (name.includes("silver") || name.includes("metallic")) return "#9ca3af";
    if (name.includes("red")) return "#dc2626";
    if (name.includes("blue")) return "#2563eb";
    if (name.includes("gray") || name.includes("grey")) return "#6b7280";
    if (name.includes("green")) return "#16a34a";
    if (name.includes("yellow") || name.includes("gold")) return "#facc15";
    if (name.includes("orange")) return "#f97316";
    if (name.includes("brown")) return "#7c4a31";
    if (name.includes("beige")) return "#e5decf";
    if (name.includes("purple")) return "#8b5cf6";
    if (name.includes("pink")) return "#ec4899";
    return "#e5e7eb";
  };

  return (
    <div
      ref={cardRef}
      className={`w-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-200 overflow-hidden cursor-pointer group animate-on-scroll animate-fade-up delay-${(index % 6) * 100} ${cardVisible ? 'visible' : ''}`}
      onClick={() => onOpenDetails(car)}
    >
      <div className="relative h-60 w-full bg-gray-100">
        <img
          src={defaultBackground}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
        />
        <img
          src={car.image_url || defaultBackground}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          className="relative w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
          {car.model}
        </h3>
        <p className="text-sm text-gray-600 truncate">
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
          <div className="text-lg font-semibold text-black">
            ₱{car.price_per_day}/day
          </div>
          
          {/* FIXED: Show unique colors with availability counts */}
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2 font-medium">Available Colors:</div>
            {isLoading ? (
              <div className="animate-pulse flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                <div className="w-6 h-6 rounded-full bg-gray-200"></div>
              </div>
            ) : colorStats.length > 0 ? (
              <div className="flex gap-3 items-center flex-wrap">
                {colorStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full border-2 shadow-sm relative"
                      style={{
                        backgroundColor: getColorHex(stat.color),
                        borderColor: getColorHex(stat.color) === '#ffffff' ? '#e5e7eb' : getColorHex(stat.color)
                      }}
                      title={`${stat.color} - ${stat.available} available of ${stat.total} total`}
                    >
                      {/* Show count badge if multiple units */}
                      {stat.total > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[8px] rounded-full flex items-center justify-center font-bold border border-white">
                          {stat.total}
                        </span>
                      )}
                    </div>
                    <span className="text-xs">
                      {stat.available > 0 ? (
                        <span className="font-semibold text-gray-900">{stat.available}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No variants available</span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRentClick(car);
            }}
            disabled={isLoading || colorStats.every(s => s.available === 0)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              isLoading || colorStats.every(s => s.available === 0)
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {colorStats.every(s => s.available === 0) ? 'Not Available' : 'Rent Now'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(car);
            }}
            className="flex-1 py-2 px-4 border text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===========================
   Fleet Section - WITH ANIMATION
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
  const [titleRef, titleVisible] = useScrollAnimation()

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
    <section className="py-20 bg-[#F0F5F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={titleRef}
          className={`text-center mb-16 animate-on-scroll animate-fade-down ${titleVisible ? 'visible' : ''}`}
        >
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
              {filteredVehicles.slice(0, 6).map((vehicle, index) => (
                <CarCard
                  key={vehicle.id}
                  car={vehicle}
                  onRentClick={onRentClick}
                  onOpenDetails={onOpenDetails}
                  index={index}
                />
              ))}
            </div>

            {/* See More Button - Always show if there are any vehicles */}
            {filteredVehicles.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => navigate('/cars')}
                  className="bg-[#101010] text-gray-50 px-6 py-3 rounded-full font-medium text-sm hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md"
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

/* ===========================
   FAQs - WITH ANIMATION (FADE UP FROM BOTTOM)
   =========================== */
   const FAQs = () => {
    const [openIndex, setOpenIndex] = useState(null)
    const [leftRef, leftVisible] = useScrollAnimation()
    const [rightRef, rightVisible] = useScrollAnimation()
    const [content, setContent] = useState(null)
  
    useEffect(() => {
      const fetchContent = async () => {
        try {
          const { data, error } = await supabase
            .from('website_content')
            .select('*')
            .eq('section', 'faqs')
            .single();
          
          if (error) throw error;
          setContent(data.content);
        } catch (err) {
          console.error('Error fetching FAQs content:', err);
        }
      };
      
      fetchContent();
    }, []);
  
    const toggleFAQ = (i) => setOpenIndex(openIndex === i ? null : i)
  
    if (!content) return null;
  
    return (
      <section
        ref={leftRef}
        className="relative mt-10 px-6 md:px-10 lg:px-20 py-10 sm:py-14 md:py-16 lg:py-20 text-gray-900"
        style={{
          backgroundImage: `url(${aboutcircle})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div className={`transition-all duration-1000 ${leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}>
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 transition-all duration-700 ${
              leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              {content.title} <span className="underline decoration-gray-900">Answered</span> <br />
              {content.subtitle}
            </h2>
  
            <div className="space-y-4 mt-8">
              {content.questions.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-4 cursor-pointer bg-white/90 text-gray-900 shadow-sm transition-all duration-700 ${
                    leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${400 + (i * 150)}ms` }}
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
  
          <div 
            ref={rightRef}
            className={`relative transition-all duration-1000 delay-300 ${
              rightVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <img
              src={faqscar1}
              alt="Customer Support"
              className="rounded-lg w-full h-full object-cover mt-10 sm:mt-16 md:mt-24 lg:mt-40"
            />
          </div>
        </div>
      </section>
    )
  }
  
  /* ===========================
     Gallery Section - NEW (Place after FAQs, before Contact)
     =========================== */
     const GallerySection = () => {
      const [titleRef, titleVisible] = useScrollAnimation();
      const [images, setImages] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedImage, setSelectedImage] = useState(null);
      const [currentIndex, setCurrentIndex] = useState(0);
      const [currentPage, setCurrentPage] = useState(0);
      const imagesPerPage = 6;
    
      useEffect(() => {
        const fetchGallery = async () => {
          try {
            const { data, error } = await supabase
              .from('gallery_images')
              .select('*')
              .eq('is_active', true)
              .order('display_order', { ascending: true });
            
            if (error) throw error;
            setImages(data || []);
          } catch (err) {
            console.error('Error fetching gallery:', err);
          } finally {
            setLoading(false);
          }
        };
        
        fetchGallery();
      }, []);
    
      const openLightbox = (image, index) => {
        setSelectedImage(image);
        setCurrentIndex(index);
      };
    
      const closeLightbox = () => {
        setSelectedImage(null);
      };
    
      const goToPrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        setCurrentIndex(newIndex);
        setSelectedImage(images[newIndex]);
      };
    
      const goToNext = () => {
        const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
        setCurrentIndex(newIndex);
        setSelectedImage(images[newIndex]);
      };
    
      const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
      };
    
      const goToNextPage = () => {
        const maxPage = Math.ceil(images.length / imagesPerPage) - 1;
        setCurrentPage((prev) => Math.min(maxPage, prev + 1));
      };
    
      const getCurrentImages = () => {
        const start = currentPage * imagesPerPage;
        const end = start + imagesPerPage;
        return images.slice(start, end);
      };
    
      const totalPages = Math.ceil(images.length / imagesPerPage);
      const hasMultiplePages = totalPages > 1;
    
      if (loading) return null;
      if (images.length === 0) return null;
    
      const currentImages = getCurrentImages();
    
      return (
        <>
          <section className="py-20 mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div 
                ref={titleRef}
                className={`text-center mb-16 animate-on-scroll animate-fade-down ${titleVisible ? 'visible' : ''}`}
              >
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Our Gallery
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Take a look at our collection of vehicles and memorable moments with our satisfied customers.
                </p>
              </div>
        {/* Gallery Grid with Navigation */}
        <div className="relative px-12 sm:px-16 lg:px-20">
            {/* Left Arrow - Only show if multiple pages and not on first page */}
            {hasMultiplePages && currentPage > 0 && (
              <button
                onClick={goToPreviousPage}
                className="absolute -left-0 sm:-left-2 lg:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-900 hover:bg-gray-800 shadow-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="Previous batch"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Right Arrow - Only show if multiple pages and not on last page */}
            {hasMultiplePages && currentPage < totalPages - 1 && (
              <button
                onClick={goToNextPage}
                className="absolute -right-0 sm:-right-2 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-900 hover:bg-gray-800 shadow-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="Next batch"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
    
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {currentImages.map((image, index) => {
                    const globalIndex = currentPage * imagesPerPage + index;
                    return (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                        onClick={() => openLightbox(image, globalIndex)}
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={image.image_url}
                            alt={image.title || 'Gallery image'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 text-white">
                            {image.title && (
                              <h3 className="text-sm sm:text-base lg:text-xl font-bold mb-1 sm:mb-2 line-clamp-2">{image.title}</h3>
                            )}
                            {image.description && (
                              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 hidden sm:block">{image.description}</p>
                            )}
                            <p className="text-xs text-gray-300 mt-1 sm:mt-2 hidden lg:block">
                              {new Date(image.uploaded_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
    
                {/* Page Indicators */}
                {hasMultiplePages && (
                  <div className="flex justify-center items-center gap-2 mt-6 sm:mt-8">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          index === currentPage 
                            ? 'bg-gary-900 w-6 sm:w-8' 
                            : 'bg-gray-300 hover:bg-gray-400 w-1.5 sm:w-2'
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    ))}
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      {currentPage + 1} / {totalPages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
    
          {/* Lightbox Modal */}
          {selectedImage && (
            <div 
              className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl transition-colors z-10"
              >
                ✕
              </button>
    
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-2 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl transition-colors"
              >
                ←
              </button>
    
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl transition-colors"
              >
                →
              </button>
    
              <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title || 'Gallery image'}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                {(selectedImage.title || selectedImage.description || selectedImage.uploaded_date) && (
                  <div className="mt-4 sm:mt-6 text-center text-white px-4">
                    {selectedImage.title && (
                      <h3 className="text-lg sm:text-2xl font-bold mb-2">{selectedImage.title}</h3>
                    )}
                    {selectedImage.description && (
                      <p className="text-sm sm:text-base text-gray-300 mb-2">{selectedImage.description}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-400">
                       {new Date(selectedImage.uploaded_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Image {currentIndex + 1} of {images.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      );
    };
/* ===========================
   Contact Us - WITH ANIMATION (FADE UP FROM BOTTOM)
   =========================== */
const ContactUs = () => {
  const [titleRef, titleVisible] = useScrollAnimation()
  const [mapRef, mapVisible] = useScrollAnimation()
  const [detailsRef, detailsVisible] = useScrollAnimation()

  return (
    <section className="relative mt-10 py-20 px-6 md:px-10 lg:px-20 text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div 
          ref={titleRef}
          className={`text-center mb-12 animate-on-scroll animate-fade-up ${titleVisible ? 'visible' : ''}`}
        >
          <h2 className="text-4xl lg:text-5xl font-bold">Contact Us</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch for inquiries, bookings, or support — our team is always ready to help.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Map */}
          <div 
            ref={mapRef}
            className={`bg-gray-50 rounded-xl overflow-hidden shadow-md animate-on-scroll animate-fade-up delay-200 ${mapVisible ? 'visible' : ''}`}
          >
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
          <div 
            ref={detailsRef}
            className={`animate-on-scroll animate-fade-up delay-300 ${detailsVisible ? 'visible' : ''}`}
          >
            <h3 className="text-2xl font-semibold mb-4">Contact Details</h3>
            <p className="text-gray-600 mb-8">
              Here's how you can reach us. Contact us by phone, email, or visit our office — whichever works best for you.
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

/* ===========================
   Footer
   =========================== */
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
            <li><a href="#faqs" className="hover:text-white">FAQs</a></li>
            <li><a href="#gallery" className="hover:text-white">Gallery</a></li>
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
    const [bookings, setBookings] = useState([])
  
    // sections refs
    const heroRef = useRef(null)
    const aboutRef = useRef(null)
    const whyChooseUsRef = useRef(null)
    const fleetRef = useRef(null)
    const faqRef = useRef(null)
    const galleryRef = useRef(null)
    const contactRef = useRef(null)
    const FooterRef = useRef(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isRentalOpen, setIsRentalOpen] = useState(false)
    const [selectedVariant, setSelectedVariant] = useState(null)
  
    const handleOpenDetails = (car) => {
      setSelectedCar(car)
      setSelectedVariant(null)
      setIsDetailsOpen(true)
    }
  
    const fetchBookings = async () => {
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
      setIsDetailsOpen(false)
      setIsRentalOpen(true)
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
            galleryRef,  // ✅ ADD THIS LINE
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
  
        <div ref={galleryRef} id="gallery">
          <GallerySection />
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
          
          @keyframes fade-up {
            from {
              opacity: 0;
              transform: translateY(60px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fade-down {
            from {
              opacity: 0;
              transform: translateY(-60px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fade-left {
            from {
              opacity: 0;
              transform: translateX(-60px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fade-right {
            from {
              opacity: 0;
              transform: translateX(60px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-on-scroll:not(.visible) {
            opacity: 0;
            transform: translateY(60px);
          }
          
          .animate-on-scroll.visible {
            animation-duration: 0.8s;
            animation-fill-mode: both;
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .animate-fade-up.visible {
            animation-name: fade-up;
          }
          
          .animate-fade-down.visible {
            animation-name: fade-down;
          }
          
          .animate-fade-left.visible {
            animation-name: fade-left;
          }
          
          .animate-fade-right.visible {
            animation-name: fade-right;
          }
          
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-300 { animation-delay: 0.3s; }
          .delay-400 { animation-delay: 0.4s; }
          .delay-500 { animation-delay: 0.5s; }
        `}</style>
      </div>
    )
  }
  
  export default App
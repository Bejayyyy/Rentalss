import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { X, ChevronDown, Calendar, User, Clock, CreditCard, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { IoSpeedometerOutline, IoPeopleOutline, IoCarOutline } from "react-icons/io5"
import { FaFacebookF, FaInstagram } from "react-icons/fa"
import { MapPin, Phone, Mail } from "lucide-react"
import { supabase } from "./lib/supabase"
import aboutcircle from "./assets/circleBg.jpg"
import logo from "./assets/logo/logoRental.png"
import faqscar1 from "./assets/faqscar.png"
import BackgroundImage from "./assets/HeroPage/section_bg2.png"
import defaultBackground from "./assets/CarScreen/background.jpg"
import HeroPageCar2 from "./assets/HeroPage/car2.png"

/* ===========================
   Intersection Observer Hook for Animations
   =========================== */
   const useScrollAnimation = () => {
    const [ref, setRef] = useState(null)
    const [isVisible, setIsVisible] = useState(false)
    const [hasAnimated, setHasAnimated] = useState(false) // Track if already animated
  
    useEffect(() => {
      if (!ref) return
  
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Only set visible if it hasn't animated yet
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true)
            setHasAnimated(true) // Mark as animated
          }
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -100px 0px'
        }
      )
  
      observer.observe(ref)
      return () => observer.disconnect()
    }, [ref, hasAnimated])
  
    return [setRef, isVisible]
  }
/* ===========================
   Toast Component
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

/* ===========================
   Details Modal
   =========================== */
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
   Rental Modal
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
  const [colorGroups, setColorGroups] = useState([]);
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
        
        const groups = {};
        data.forEach(variant => {
          const colorKey = variant.color.toLowerCase().trim();
          if (!groups[colorKey]) {
            groups[colorKey] = {
              color: variant.color,
              variants: []
            };
          }
          groups[colorKey].variants.push(variant);
        });
        
        setColorGroups(Object.values(groups));
        
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

  const renderColorGroupSwatch = (colorGroup) => {
    const colorName = colorGroup.color.toLowerCase();
    let bgColor = getColorHex(colorGroup.color);
    const availableCount = colorGroup.variants.filter(v => v.is_available).length;
    const totalCount = colorGroup.variants.length;

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
        {totalCount > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[8px] rounded-full flex items-center justify-center font-bold border border-white">
            {totalCount}
          </span>
        )}
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
                {selectedVariant && colorGroups.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({colorGroups.find(g => 
                      g.variants.some(v => v.id === selectedVariant.id)
                    )?.variants.filter(v => v.is_available).length || 0} available)
                  </span>
                )}
              </div>

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
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Upload  Driver's License Card Image *</label>
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
   Car Card Component with Animation
   =========================== */
const CarCard = ({ car, onRentClick, onOpenDetails, index }) => {
  const [colorStats, setColorStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardRef, cardVisible] = useScrollAnimation()

  useEffect(() => {
    const fetchVariantStats = async () => {
      if (!car?.id) return;
      setIsLoading(true);

      try {
        const { data: variants, error: varError } = await supabase
          .from("vehicle_variants")
          .select("*")
          .eq("vehicle_id", car.id)
          .order("created_at", { ascending: true });

        if (varError) throw varError;

        const today = new Date().toISOString().split('T')[0];
        const { data: bookings, error: bookError } = await supabase
          .from("bookings")
          .select("*")
          .eq("status", "confirmed")
          .gte("rental_end_date", today)
          .lte("rental_start_date", today);

        if (bookError) throw bookError;

        const colorGroups = {};
        
        variants.forEach(variant => {
          const colorKey = variant.color.toLowerCase().trim();
          
          if (!colorGroups[colorKey]) {
            colorGroups[colorKey] = {
              color: variant.color,
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
      className={`w-full bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group animate-on-scroll animate-fade-up delay-${(index % 6) * 100} ${cardVisible ? 'visible' : ''}`}
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
          className="relative w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
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
   Navbar Component
   =========================== */
const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavClick = (path) => {
    if (path.includes('#')) {
      const section = path.split('#')[1]
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      navigate(path)
    }
    setIsOpen(false)
  }

  return (
    <nav className="bg-[#eff2f7] sticky top-0 z-50 ">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="The Rental Den Logo" className="h-12 w-auto mr-2" />
            <span className="text-xl font-bold text-gray-900">The Rental Den</span>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            <button onClick={() => handleNavClick('/')} className="font-medium text-gray-600 hover:text-black transition-colors">
              HOME
            </button>
            <button onClick={() => handleNavClick('/#about')} className="font-medium text-gray-600 hover:text-black transition-colors">
              ABOUT US
            </button>
            <button onClick={() => handleNavClick('/cars')} className="font-medium text-black relative">
              CARS
              <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-black rounded" />
            </button>
            <button onClick={() => handleNavClick('/#faqs')} className="font-medium text-gray-600 hover:text-black transition-colors">
              FAQs
            </button>
            <button onClick={() => handleNavClick('/#contact')} className="font-medium text-gray-600 hover:text-black transition-colors">
              CONTACT US
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-700 hover:text-black">
              {isOpen ? <X className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-2 pt-2">
              <button onClick={() => handleNavClick('/')} className="block w-full text-left font-medium text-gray-600 hover:text-black">
                HOME
              </button>
              <button onClick={() => handleNavClick('/#about')} className="block w-full text-left font-medium text-gray-600 hover:text-black">
                ABOUT US
              </button>
              <button onClick={() => handleNavClick('/cars')} className="block w-full text-left font-medium text-black">
                CARS
              </button>
              <button onClick={() => handleNavClick('/#faqs')} className="block w-full text-left font-medium text-gray-600 hover:text-black">
                FAQs
              </button>
              <button onClick={() => handleNavClick('/#contact')} className="block w-full text-left font-medium text-gray-600 hover:text-black">
                CONTACT US
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

/* ===========================
   Footer Component
   =========================== */
const Footer = () => {
  const navigate = useNavigate()
  
  const handleNavClick = (path) => {
    if (path.includes('#')) {
      const section = path.split('#')[1]
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      navigate(path)
    }
  }
  
  return (
    <footer className="bg-[#101010] text-gray-300 py-12 px-6 md:px-10 lg:px-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
          <p className="mb-2">Cebu City, Philippines</p>
          <p className="mb-4">+63 900 000 0000</p>
          <div className="flex space-x-3">
            <a href="https://www.facebook.com/profile.php?id=61572309459200" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 transition">
              <FaFacebookF size={14} />
            </a>
            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 transition">
              <FaInstagram size={14} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><button onClick={() => handleNavClick('/')} className="hover:text-white">Home</button></li>
            <li><button onClick={() => handleNavClick('/#about')} className="hover:text-white">About Us</button></li>
            <li><button onClick={() => handleNavClick('/cars')} className="hover:text-white">Cars</button></li>
            <li><button onClick={() => handleNavClick('/#faqs')} className="hover:text-white">FAQs</button></li>
            <li><button onClick={() => handleNavClick('/#contact')} className="hover:text-white">Contact</button></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} The Rental Den. All Rights Reserved.
      </div>
    </footer>
  )
}

/* ===========================
   Hero Filter Section with Animation
   =========================== */
const HeroFilterSection = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    type: "All",
    seats: "All",
    priceRange: "All"
  })

  const [vehicleTypes, setVehicleTypes] = useState(["All"])
  const [seatOptions, setSeatOptions] = useState(["All"])
  const [heroRef, heroVisible] = useScrollAnimation()

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("type, seats")
      
      if (!error && data) {
        const uniqueTypes = [...new Set(data.map(v => v.type).filter(Boolean))]
        setVehicleTypes(["All", ...uniqueTypes])
        
        const uniqueSeats = [...new Set(data.map(v => v.seats).filter(Boolean))]
          .sort((a, b) => Number(a) - Number(b))
        setSeatOptions(["All", ...uniqueSeats])
      }
    }
    fetchFilterOptions()
  }, [])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div 
      ref={heroRef}
      className={`relative h-[550px] sm:h-[600px] lg:h-[700px] bg-[#eff2f7] overflow-hidden animate-on-scroll animate-fade-down ${heroVisible ? 'visible' : ''}`}
    >
      <div className="absolute inset-0 px-4 sm:px-8 py-2">
        <div 
          className="w-full h-full bg-cover bg-center rounded-3xl"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${aboutcircle})`
          }}
        />
      </div>
  
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div className="text-left max-w-2xl mb-3 sm:mb-6 lg:mb-0">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 mt-4 sm:mt-8 lg:mt-10 leading-tight">
            Discover Your Perfect<br />Car Today
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-200">
            Real car rentals for rent in Cebu
          </p>
        </div>
  
        <div className="bg-white rounded-xl sm:rounded-2xl mt-6 sm:mt-40 lg:mt-60 shadow-2xl p-3 sm:p-6 lg:p-6 max-w-5xl mx-auto w-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            <div>
              <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-3">Vehicle Type</label>
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl appearance-none bg-white focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer text-gray-900 font-medium"
                >
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
  
            <div>
              <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-3">Number of Seats</label>
              <div className="relative">
                <select
                  value={filters.seats}
                  onChange={(e) => handleFilterChange('seats', e.target.value)}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl appearance-none bg-white focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer text-gray-900 font-medium"
                >
                  {seatOptions.map(seat => (
                    <option key={seat} value={seat}>
                      {seat === "All" ? "All Seats" : `${seat} Seats`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
  
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-3">Price Range</label>
              <div className="relative">
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-base border-2 border-gray-200 rounded-lg sm:rounded-xl appearance-none bg-white focus:ring-2 focus:ring-black focus:border-black transition-all cursor-pointer text-gray-900 font-medium"
                >
                  <option value="All">All Prices</option>
                  <option value="0-2000">₱0 - ₱2,000</option>
                  <option value="2000-4000">₱2,000 - ₱4,000</option>
                  <option value="4000-6000">₱4,000 - ₱6,000</option>
                  <option value="6000+">₱6,000+</option>
                </select>
                <ChevronDown className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              </div>
              <div className="hidden sm:block absolute top-0 left-0 w-1/2 h-1/2 pointer-events-none">
                <img 
                  src={faqscar1} 
                  alt="Featured Car" 
                  className="absolute top-10 sm:top-16 lg:top-22 left-20 sm:left-32 lg:left-150 w-full h-auto object-contain transform scale-75 sm:scale-90 lg:scale-100 animate-float-car"
                  style={{ maxHeight: '800px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===========================
   CarsPage Main Component
   =========================== */
   const CarsPage = () => {
    const [vehicles, setVehicles] = useState([])
    const [filteredVehicles, setFilteredVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isRentalOpen, setIsRentalOpen] = useState(false)
    const [selectedCar, setSelectedCar] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [titleRef, titleVisible] = useScrollAnimation()
  
    // Scroll to top when component mounts
    useEffect(() => {
      window.scrollTo(0, 0)
    }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("vehicles")
        .select(`*, vehicle_variants ( available_quantity )`)
        .order("created_at", { ascending: false })
      
      if (error) throw error

      const enriched = (data || []).map((v) => {
        const variants = v.vehicle_variants || []
        const totalAvailable = variants.reduce((sum, vv) => sum + (vv.available_quantity || 0), 0)
        return {
          ...v,
          available: totalAvailable > 0,
          available_quantity: totalAvailable,
          total_quantity: variants.length
        }
      })

      setVehicles(enriched)
      setFilteredVehicles(enriched)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleFilterChange = (filters) => {
    let filtered = [...vehicles]

    if (filters.type !== "All") {
      filtered = filtered.filter(v => v.type === filters.type)
    }

    if (filters.seats !== "All") {
      const selectedSeats = Number(filters.seats)
      filtered = filtered.filter(v => Number(v.seats) === selectedSeats)
    }

    if (filters.priceRange !== "All") {
      const [min, max] = filters.priceRange.includes('+') 
        ? [Number(filters.priceRange.replace('+', '')), Infinity]
        : filters.priceRange.split('-').map(Number)
      
      filtered = filtered.filter(v => {
        const price = v.price_per_day || 0
        return price >= min && (max === Infinity || price <= max)
      })
    }

    setFilteredVehicles(filtered)
  }

  const handleOpenDetails = (car) => {
    setSelectedCar(car)
    setSelectedVariant(null)
    setIsDetailsOpen(true)
  }

  const handleRentClick = (car, variant = null) => {
    setSelectedCar(car)
    setSelectedVariant(variant)
    setIsDetailsOpen(false)
    setIsRentalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F0F5F8] flex flex-col">
      <Navbar />

      <HeroFilterSection onFilterChange={handleFilterChange} />

      <section className="py-5 bg-[#F0F5F8] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={titleRef}
            className={`text-center mb-5 animate-on-scroll animate-fade-up ${titleVisible ? 'visible' : ''}`}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Available Vehicles
            </h2>
            <p className="text-lg text-gray-600">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-gray-600">Loading vehicles...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-red-600">Error: {error}</div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-lg text-gray-600">No vehicles match your filters.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">
              {filteredVehicles.map((vehicle, index) => (
                <CarCard
                  key={vehicle.id}
                  car={vehicle}
                  onRentClick={handleRentClick}
                  onOpenDetails={handleOpenDetails}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        car={selectedCar}
        onRentClick={handleRentClick}
      />

      <RentalModal
        isOpen={isRentalOpen}
        onClose={() => setIsRentalOpen(false)}
        selectedCar={selectedCar}
      />

      <Footer />

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
        
        .delay-0 { animation-delay: 0s; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-100 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  )
}

export default CarsPage
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
   Car Card Component
   =========================== */
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
   Hero Filter Section - FIXED
   =========================== */
const HeroFilterSection = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    type: "All",
    seats: "All",
    priceRange: "All"
  })

  const [vehicleTypes, setVehicleTypes] = useState(["All"])
  const [seatOptions, setSeatOptions] = useState(["All"])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("type, seats")
      
      if (!error && data) {
        // Get unique types
        const uniqueTypes = [...new Set(data.map(v => v.type).filter(Boolean))]
        setVehicleTypes(["All", ...uniqueTypes])
        
        // Get unique seats and sort
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
    <div className="relative h-[550px] sm:h-[600px] lg:h-[700px] bg-[#eff2f7] overflow-hidden">
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
  
        <div className="bg-white rounded-xl sm:rounded-2xl mt-6 sm:mt-40 lg:mt-60 shadow-2xl p-3 sm:p-6 lg:p-6 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {/* Vehicle Type */}
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
  
            {/* Number of Seats */}
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
  
            {/* Price Range */}
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
               {/* Car Image at Top Left - Hidden on small mobile, visible on larger screens */}
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
   CarsPage with CORRECTED Filtering
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

    // Filter by type
    if (filters.type !== "All") {
      filtered = filtered.filter(v => v.type === filters.type)
    }

    // Filter by seats - CONVERT TO NUMBER
    if (filters.seats !== "All") {
      const selectedSeats = Number(filters.seats)
      filtered = filtered.filter(v => Number(v.seats) === selectedSeats)
    }

    // Filter by price
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
          <div className="text-center mb-5">
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
              {filteredVehicles.map((vehicle) => (
                <CarCard
                  key={vehicle.id}
                  car={vehicle}
                  onRentClick={handleRentClick}
                  onOpenDetails={handleOpenDetails}
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
      `}</style>
    </div>
  )
}

export default CarsPage
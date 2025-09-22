
import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, X, CheckCircle, AlertCircle, Menu,ChevronLeft,ChevronRight,Calendar,User,Clock,CreditCard,Upload} from "lucide-react"
import { Car, Users, Gauge } from "lucide-react"
import { MapPin, Phone, Mail } from "lucide-react"
import { supabase } from "./lib/supabase"
import HeroPageCar2 from "./assets/HeroPage/car2.png"
import logo from "./assets/logo/logoRental.png"
import aboutcra from "./assets/aboutuscar.png"
import aboutcircle from "./assets/circleBg.jpg"
import carImage from "./assets/Cars.png"
import carIcon from "./assets/iconscar.png"
import calendarIcon from "./assets/iconscalendar.png"
import supportIcon from "./assets/iconssupport.png"
import BackgroundImage from "./assets/HeroPage/section_bg2.png"
import bgContact from "./assets/ContactUs.jpg"
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
  const isRentButtonDisabled =
    !selectedVariant || Number(selectedVariant.available_quantity) === 0;

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
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        
        {/* LEFT SIDE - Car Image with Background Image */}
        <div
          className="relative lg:w-3/5 w-full flex items-center justify-center p-6 bg-cover bg-center"
          style={{
            backgroundImage: `url(${defaultBackground})`,
          }}
        >
     {/* Car Image */}
     <div className="relative w-full max-w-2xl flex items-center justify-center">
  <img
    src={selectedVariant?.image_url || car.image_url || defaultBackground}
    alt={`${car.make} ${car.model}`}
    className="w-[600px] h-auto object-contain drop-shadow-2xl scale-110 mt-20"
  />
</div>
{/* Color Variants */}
<div className="absolute bottom-10 left-1/2 -translate-x-1/2">
  <div className="flex gap-4 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg">
    {variants.map(renderColorSwatch)}
  </div>
</div>

        </div>

        {/* RIGHT SIDE - Car Details */}
        <div className="relative lg:w-2/5 w-full flex flex-col p-8 overflow-y-auto">
          
          {/* Close Button (inside white panel, top-right) */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Car Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {car.make}
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                {car.year}
              </span>
            </h1>
            <h2 className="text-xl font-light text-gray-700">{car.model}</h2>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Gauge className="w-5 h-5" />
              <span className="text-lg font-medium">2393 CC</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span className="text-lg font-medium">{car.seats} Seater</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-gray-900 mb-6">
            ₱{car.price_per_day?.toLocaleString()}
            <span className="text-lg font-normal text-gray-500">/day</span>
          </div>

          {/* Description */}
          <div className="flex-1 mb-6">
            <p className="text-gray-600 leading-relaxed">
              {car.description ||
                "Experience luxury and performance with this premium vehicle. Perfect for business trips, special occasions, or when you simply want to enjoy the finest driving experience."}
            </p>
          </div>

          {/* Selected Variant */}
          {selectedVariant && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Selected Color</div>
                  <div className="font-semibold text-gray-900">{selectedVariant.color}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Available</div>
                  <div className="font-semibold text-gray-900">
                    {selectedVariant.available_quantity} units
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rent Now Button */}
          <div className="mt-auto">
            <button
              onClick={() => {
                onClose();
                onRentClick(car, selectedVariant);
              }}
              disabled={isRentButtonDisabled}
              className={`w-full py-4 rounded-2xl text-lg font-semibold shadow-lg transition-colors duration-200 ${
                isRentButtonDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 hover:shadow-xl"
              }`}
            >
              {isRentButtonDisabled ? "Fully Booked" : "Rent Now"}
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
  
   
    useEffect(() => {
      document.body.style.overflow = isOpen ? "hidden" : "auto";
      return () => (document.body.style.overflow = "auto");
    }, [isOpen]);
  
    // 🆕 Define the refreshVariants function
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
    
          // ✅ Auto-select first available variant
          const firstAvailable = data.find(v => Number(v.available_quantity) > 0);
          if (firstAvailable) {
            setSelectedVariant(firstAvailable);
            setFormData((s) => ({ ...s, vehicleVariantId: firstAvailable.id }));
          }
        } else {
          const mockVariants = [
            { id: 1, color: 'Pearl White', image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop', available_quantity: 3 },
            { id: 2, color: 'Midnight Black', image_url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&h=600&fit=crop', available_quantity: 2 },
            { id: 3, color: 'Silver Metallic', image_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop', available_quantity: 0 },
          ];
          setVariants(mockVariants);
    
          // ✅ Also auto-select mock first available
          const firstAvailable = mockVariants.find(v => v.available_quantity > 0);
          if (firstAvailable) {
            setSelectedVariant(firstAvailable);
            setFormData((s) => ({ ...s, vehicleVariantId: firstAvailable.id }));
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedCar]);
  
    useEffect(() => {
      if (formData.pickupDate && formData.returnDate && selectedCar) {
        const start = new Date(formData.pickupDate);
        const end = new Date(formData.returnDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 0) {
          setRentalDays(diffDays);
          setTotalPrice(diffDays * (selectedCar.price_per_day || 3500));
        } else {
          setRentalDays(0);
          setTotalPrice(0);
        }
      } else {
        setRentalDays(0);
        setTotalPrice(0);
      }
    }, [formData.pickupDate, formData.returnDate, selectedCar]);
  
    const showToast = (type, message) => setToast({ type, message, isVisible: true });
    const hideToast = () => setToast((t) => ({ ...t, isVisible: false }));
  
    const handleInputChange = (e) => setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  
    const handleVariantSelect = (variant) => {
      setSelectedVariant(variant);
      setFormData((s) => ({ ...s, vehicleVariantId: variant?.id || "" }));
    };
  
    const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const allowed = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowed.includes(file.type)) {
        showToast("error", "Only JPG/PNG images allowed.");
        return;
      }
      setGovIdFile(file);
      setGovIdPreview(URL.createObjectURL(file));
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
        if (selectedVariant && Number(selectedVariant.available_quantity) === 0) {
          showToast("error", "Selected variant is fully booked.");
          setIsSubmitting(false);
          return;
        }
    
        const start = new Date(formData.pickupDate);
        const end = new Date(formData.returnDate);
        if (!(formData.pickupDate && formData.returnDate) || end <= start) {
          showToast("error", "Please set a valid rental date range.");
          setIsSubmitting(false);
          return;
        }
    
        // Upload Government ID
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
    
        // Insert booking into database
        const { data: insertedBooking, error: insertError } = await supabase
          .from("bookings")
          .insert([bookingRow])
          .select()
          .single();
        
        if (insertError) throw insertError;
    
        // Send confirmation email
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
            console.warn("Email sending failed:", emailResult.error);
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
  
      if (colorName.includes('white') || colorName.includes('pearl') || colorName.includes('ivory') || colorName.includes('cream')) 
        bgColor = '#ffffff';
    else if (colorName.includes('black') || colorName.includes('midnight') || colorName.includes('jet') || colorName.includes('onyx')) 
        bgColor = '#1f2937';
    else if (colorName.includes('silver') || colorName.includes('metallic') || colorName.includes('platinum')) 
        bgColor = '#9ca3af';
    else if (colorName.includes('red') || colorName.includes('crimson') || colorName.includes('maroon') || colorName.includes('burgundy')) 
        bgColor = '#dc2626';
    else if (colorName.includes('blue') || colorName.includes('navy') || colorName.includes('royal') || colorName.includes('sky')) 
        bgColor = '#2563eb';
    else if (colorName.includes('gray') || colorName.includes('grey') || colorName.includes('charcoal') || colorName.includes('ash')) 
        bgColor = '#6b7280';
    else if (colorName.includes('green') || colorName.includes('forest') || colorName.includes('olive') || colorName.includes('lime')) 
        bgColor = '#16a34a';
    else if (colorName.includes('yellow') || colorName.includes('gold') || colorName.includes('amber')) 
        bgColor = '#facc15';
    else if (colorName.includes('orange') || colorName.includes('tangerine') || colorName.includes('copper')) 
        bgColor = '#f97316';
    else if (colorName.includes('brown') || colorName.includes('chocolate') || colorName.includes('tan') || colorName.includes('beige')) 
        bgColor = '#7c4a31';
    else if (colorName.includes('purple') || colorName.includes('violet') || colorName.includes('lavender')) 
        bgColor = '#8b5cf6';
    else if (colorName.includes('pink') || colorName.includes('rose') || colorName.includes('magenta')) 
        bgColor = '#ec4899';
    else if (colorName.includes('cyan') || colorName.includes('teal') || colorName.includes('aqua')) 
        bgColor = '#06b6d4';
    else if (colorName.includes('bronze') || colorName.includes('copper')) 
        bgColor = '#b87333';
    else 
        bgColor = '#d1d5db'; // fallback/unknown color
    
  
      const isSelected = selectedVariant?.id === variant.id;
      const isUnavailable = Number(variant.available_quantity) === 0;
  
      return (
        <button
          key={variant.id}
          onClick={() => !isUnavailable && handleVariantSelect(variant)}
          disabled={isUnavailable}
          className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 min-w-[100px] ${
            isUnavailable
              ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
              : 'hover:bg-white hover:shadow-md cursor-pointer border-gray-200 hover:border-gray-300'
          } ${isSelected ? 'ring-3 ring-black ring-opacity-20 bg-white shadow-lg border-gray-400' : ''}`}
        >
          <div
            className={`w-12 h-12 rounded-full border-3 shadow-sm transition-all duration-200 ${
              !isUnavailable ? 'group-hover:scale-110 group-hover:shadow-md' : ''
            } ${bgColor === '#ffffff' ? 'border-gray-300' : 'border-gray-200'} ${isSelected ? 'scale-110 shadow-md' : ''}`}
            style={{ backgroundColor: bgColor }}
          />
          <div className="text-center">
            <span className={`text-sm font-semibold block ${isSelected ? 'text-black' : 'text-gray-700'}`}>
              {variant.color}
            </span>
            <span className={`text-xs block mt-1 ${
              isUnavailable ? 'text-red-500 font-medium' :
                variant.available_quantity <= 2 ? 'text-orange-500 font-medium' : 'text-green-600'
            }`}>
              {isUnavailable ? 'Out of stock' : `${variant.available_quantity} available`}
            </span>
          </div>
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Unavailable
              </div>
            </div>
          )}
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
          <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100  rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-col lg:flex-row min-h-[700px]">
            <div className="lg:w-2/5 bg-white p-5 flex flex-col">
            <div className="flex items-center justify-center mt-23">
                <div className="w-full h-80 lg:h-96 rounded-3xl shadow-lg flex items-center justify-center overflow-hidden border border-gray-100 relative">
                  {/* Default background image */}
                  <img
                    src={defaultBackground}
                    
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Car image on top */}
                  {selectedVariant?.image_url || displayCar?.image_url ? (
                    <img
                      src={selectedVariant?.image_url || displayCar?.image_url}
                      alt={`${displayCar?.make} ${displayCar?.model}`}
                      className="relative object-contain w-full h-full p-6 mt-25"
                    />
                  ) : null}
                </div>

                </div>
 {/* Selected Color Title */}
<div className="text-center mt-5 ml-1 lg:text-left mb-2">
  <span className="text-sm text-gray-700 font-medium">Color:</span>{" "}
  <span className="font-semibold text-gray-900">
    {selectedVariant?.color || "Unavailable"}
  </span>
</div>

{/* Color Selection */}
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
    else if (colorName.includes("red")) bgColor = "#fca5a5"; // soft pink-red
    else if (colorName.includes("blue")) bgColor = "#2563eb"; // whale blue
    else if (colorName.includes("beige")) bgColor = "#e5decf";
    else if (colorName.includes("gold") || colorName.includes("brown"))
      bgColor = "#d1a054";

    const isSelected = selectedVariant?.id === variant.id;
    const isUnavailable = Number(variant.available_quantity) === 0;

    return (
      <div key={variant.id} className="relative">
        <button
          onClick={() => !isUnavailable && handleVariantSelect(variant)}
          disabled={isUnavailable}
          className={`w-5 h-5 rounded-full border-2 border-gray
            ${isSelected ? "ring-1 ring-white" : ""}
            ${isUnavailable ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
          `}
          style={{
            backgroundColor: bgColor,
          }}
          title={variant.color}
        />
        {/* Slash line for unavailable */}
        {isUnavailable && (
  <span className="absolute left-1/2 top-1/2 w-[20px] h-[1.5px] bg-red-500 rotate-45 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></span>
)}
      </div>
    );
  })}
</div>


{/* Car Details */}
<div className="mt-4 text-center lg:text-left ml-1 text-black">
  <h3 className="text-3xl font-bold mb-3">
    {displayCar?.make} {displayCar?.model}
  </h3>
  <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-black-900 mb-3">
    <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow">
      <Calendar className="w-4 h-4 text-black" />
      {displayCar?.year}
    </span>
    <span className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow">
      <Car className="w-4 h-4 text-black" />
      {displayCar?.seats} seats
    </span>
  </div>
  <div className="text-3xl font-bold text-green-600">
    ₱{displayCar?.price_per_day?.toLocaleString()}
    <span className="text-lg font-normal text-black-900 ml-1">/day</span>
  </div>
</div>
</div>

<div className="lg:w-3/5 p-8">
  <div className="flex items-center justify-between mb-8">
    <h2 className="text-3xl font-bold text-gray-900">Complete Your Booking</h2>
    <button
      onClick={onClose}
      className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
    >
      <X className="w-5 h-5 text-black" />
    </button>
  </div>

  <form onSubmit={handleSubmit} className="space-y-8">
    {/* Personal Information */}
    <div className="bg-white rounded-2xl  p-6 border border-gray-200">
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  focus:ring-black focus:border-black transition-all duration-200 bg-white"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  focus:ring-black focus:border-black transition-all duration-200 bg-white"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  focus:ring-black focus:border-black transition-all duration-200 bg-white"
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

    {/* Rental Details */}
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-black focus:border-black transition-all duration-200 bg-white"
          />
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  focus:ring-black focus:border-black transition-all duration-200 bg-white"
          />
        </div>
      </div>
      <div className="mt-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location *</label>
        <input
          type="text"
          name="pickupLocation"
          value={formData.pickupLocation}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl  focus:ring-black focus:border-black transition-all duration-200 bg-white"
          placeholder="Enter pickup location"
        />
      </div>
    </div>

    {/* Identity Verification */}
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
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

    {/* Total Price */}
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
        disabled={isSubmitting || !selectedVariant || Number(selectedVariant?.available_quantity) === 0}
        className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 transform
          ${
            isSubmitting || !selectedVariant || Number(selectedVariant?.available_quantity) === 0
              ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
              : "bg-black text-white cursor-pointer hover:bg-gray-800 shadow-lg hover:scale-105"
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

  return (
    <nav className="bg-[#eff2f7] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src={logo} alt="The Rental Den Logo" className="h-12 w-auto mr-2" />
            <span className="text-xl font-bold text-gray-900">The Rental Den</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <button
              onClick={() => handleScroll(refs.heroRef, "home")}
              className={`font-medium transition-colors relative ${
                active === "home" ? "text-black" : "text-gray-600 hover:text-black"
              }`}
            >
              HOME
              {active === "home" && <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-black rounded" />}
            </button>
            <button
              onClick={() => handleScroll(refs.whyChooseUsRef, "about")}
              className={`font-medium transition-colors relative ${
                active === "about" ? "text-black" : "text-gray-600 hover:text-black"
              }`}
            >
              ABOUT US
              {active === "about" && <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-black rounded" />}
            </button>
            <button
              onClick={() => handleScroll(refs.fleetRef, "cars")}
              className={`font-medium transition-colors relative ${
                active === "cars" ? "text-black" : "text-gray-600 hover:text-black"
              }`}
            >
              CARS
              {active === "cars" && <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-black rounded" />}
            </button>
            <button
              onClick={() => handleScroll(refs.fleetRef, "cars")}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-transform transform hover:scale-105 cursor-pointer"
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
              <button
                onClick={() => handleScroll(refs.heroRef, "home")}
                className={`block w-full text-left font-medium ${
                  active === "home" ? "text-black" : "text-gray-600 hover:text-black"
                }`}
              >
                HOME
              </button>
              <button
                onClick={() => handleScroll(refs.whyChooseUsRef, "about")}
                className={`block w-full text-left font-medium ${
                  active === "about" ? "text-black" : "text-gray-600 hover:text-black"
                }`}
              >
                ABOUT US
              </button>
              <button
                onClick={() => handleScroll(refs.fleetRef, "cars")}
                className={`block w-full text-left font-medium ${
                  active === "cars" ? "text-black" : "text-gray-600 hover:text-black"
                }`}
              >
                CARS
              </button>
              <button
                onClick={onRentClick}
                className="w-full bg-black text-white px-6 py-3  font-medium hover:bg-gray-800 transition-transform transform hover:scale-105"
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
   Why Choose Us
   =========================== */
const WhyChooseUs = () => {
  const features = [
    {
      icon: <img src={carIcon} alt="Car Icon" className="h-16 w-16 object-contain" />,
      title: "Quality Vehicles",
      description:
        "We maintain our fleet to the highest standards so you can enjoy a safe and smooth ride every time.",
    },
    {
      icon: <img src={calendarIcon} alt="Calendar Icon" className="h-16 w-16 object-contain" />,
      title: "Seamless Booking Experience",
      description: "Simple, fast, and user-friendly. Book your car online in minutes, with instant confirmation.",
    },
    {
      icon: <img src={supportIcon} alt="Support Icon" className="h-16 w-16 object-contain" />,
      title: "Local Expertise & Friendly Support",
      description:
        "Our Cebu-based team is here to help with tailored tips, great deals, and customer support whenever you need it.",
    },
  ]

  return (
    <section className="py-20 bg-[#F0F5F8] relative">
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
              className="bg-[#101010] text-white p-10 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              <div className="mb-8 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-6">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
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
          <div className="flex justify-center items-center relative">
            <div className="w-[500px] h-[500px] rounded-full overflow-hidden relative shadow-lg bg-gray-200">
              <img src={aboutcircle} alt="Circle background" className="w-full h-full object-cover" />
            </div>
            <img
              src={carImage}
              alt="Car"
              className="absolute -top-[-40%] left-[55%] -translate-x-1/2 w-[1000px] h-auto"
            />
          </div>

          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">About Rental Den</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to The Rental Den – your trusted car rental service. We offer a wide range of reliable vehicles,
              from economy cars to spacious SUVs, with transparent pricing and easy booking. Our mission is to make
              every journey smooth, memorable, and stress-free with friendly local support. At The Rental Den, we don’t
              just rent cars – we help you create lasting memories.
            </p>
          </div>
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
  ]

  return (
    <section className="relative w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-[#101010] text-white py-16 lg:py-20 px-6 md:px-10 lg:pl-16 xl:pl-24 lg:pr-10 flex flex-col">
          <div className="flex justify-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-10">How It Works</h2>
          </div>
          <div className="space-y-12 max-w-2xl mx-auto">
            {steps.map((s) => (
              <div key={s.number} className="flex items-start">
                <span className="text-5xl font-bold leading-none mr-6 w-16">{s.number}</span>
                <div className="mt-5">
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <img src={aboutcra} alt="Car side mirror" className="absolute top-0 right-0 w-full h-full object-cover" />
        </div>
      </div>
    </section>
  )
}


const CarCard = ({ car, onRentClick, onOpenDetails }) => {
  const [variantStats, setVariantStats] = useState({
    totalAvailable: 0,
    totalQuantity: 0,
    hasVariants: false,
    variantCount: 0 // Track number of different variants
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch variant availability when component mounts or car changes
  useEffect(() => {
    const fetchVariantAvailability = async () => {
      if (!car?.id) return
      
      setIsLoading(true)
      try {
        const { data: variants, error } = await supabase
          .from("vehicle_variants")
          .select("id, color, total_quantity, available_quantity")
          .eq("vehicle_id", car.id)

        if (error) {
          console.error("Error fetching variants:", error)
          // Fallback to vehicle-level availability
          setVariantStats({
            totalAvailable: car.available_quantity || 0,
            totalQuantity: car.total_quantity || 0,
            hasVariants: false,
            variantCount: 0
          })
        } else if (variants && variants.length > 0) {
          // Calculate totals from variants - this is the key fix
          const totalAvailable = variants.reduce((sum, variant) => 
            sum + (variant.available_quantity || 0), 0)
          const totalQuantity = variants.reduce((sum, variant) => 
            sum + (variant.total_quantity || 0), 0)
          
          setVariantStats({
            totalAvailable,
            totalQuantity,
            hasVariants: true,
            variantCount: variants.length // Number of different color variants
          })
        } else {
          // No variants found, use vehicle-level data
          setVariantStats({
            totalAvailable: car.available_quantity || 0,
            totalQuantity: car.total_quantity || 0,
            hasVariants: false,
            variantCount: 0
          })
        }
      } catch (error) {
        console.error("Error in fetchVariantAvailability:", error)
        // Fallback to vehicle-level availability
        setVariantStats({
          totalAvailable: car.available_quantity || 0,
          totalQuantity: car.total_quantity || 0,
          hasVariants: false,
          variantCount: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariantAvailability()
  }, [car?.id, car.available_quantity, car.total_quantity])

  // Determine if car is actually available based on variants or vehicle data
  const isActuallyAvailable = car.available && variantStats.totalAvailable > 0

  return (
    <div
      className="rounded-xl shadow-lg p-0 hover:shadow-xl cursor-pointer "
      onClick={() => onOpenDetails(car)}
    >
      <div className="relative h-64 w-full">
        {/* Default background */}
        <img
          src={defaultBackground}
          alt="Default background"
          className="absolute inset-0 w-full h-full rounded-xl  object-cover"
        />
        
        {/* Car image on top of background */}
        <img
          src={car.image_url || defaultBackground}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          className={`relative w-full h-full object-contain p-4 ${
            !isActuallyAvailable ? "filter blur-xs" : ""
          }`}
        />
        
        {!isActuallyAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-2xl bg-black/60 px-4 py-2 rounded-lg">
              Not Available
            </span>
          </div>
        )}
      </div>

      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {car.make} {car.model} ({car.year})
        </h3>

        <div className="flex items-center justify-between mb-6 text-sm text-gray-900">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
            <span>{car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}</span>
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

        <div className="mb-6">
          <div className="text-2xl font-bold text-green-600 mb-1">
            ₱{car.price_per_day}/day
          </div>
          <div className="text-sm text-gray-500">
            {isLoading ? (
              <span className="animate-pulse">Loading availability...</span>
            ) : variantStats.hasVariants && variantStats.variants && variantStats.variants.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs text-gray-400 mb-2">Availability by color:</div>
                {variantStats.variants.map((variant, index) => (
                  <div key={variant.id} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-600">{variant.color}:</span>
                    <span className={`font-semibold ${
                      variant.available_quantity === 0 ? 'text-red-500' : 
                      variant.available_quantity <= 2 ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {variant.available_quantity}
                    </span>
                  </div>
                ))}
                <div className="pt-1 mt-2 border-t border-gray-200 text-xs">
                  <span className="text-gray-400">Total: </span>
                  <span className="font-semibold text-gray-600">
                    {variantStats.totalAvailable}/{variantStats.totalQuantity}
                  </span>
                </div>
              </div>
            ) : (
              <>
                Available: {variantStats.totalAvailable}/{variantStats.totalQuantity} units
              </>
            )}
          </div>
      
        </div>

        <div className="flex gap-3">
          {/* Rent Now → directly opens rental form */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRentClick(car);
            }}
            disabled={!isActuallyAvailable || isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors
              ${!isActuallyAvailable || isLoading 
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                : 'bg-black text-white cursor-pointer hover:bg-gray-900'
              }`}
          >
            Rent Now
          </button>


          {/* Details → opens details modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails?.(car);
            }}
            className="flex-1 py-3 px-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Details
          </button>
        </div>

      </div>
    </div>
  )
}
/* ===========================
   Fleet Section
   =========================== */
 
const FleetSection = ({ onRentClick, onOpenDetails }) => {
  const [categories, setCategories] = useState(["All"]) // Start with just "All"
  const [vehicles, setVehicles] = useState([])
  const [filteredVehicles, setFilteredVehicles] = useState([])
  const [activeCategory, setActiveCategory] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("type")
        .not("type", "is", null) // Exclude null types
      
      if (error) throw error
      
      // Extract unique types and add "All" at the beginning
      const uniqueTypes = [...new Set(data.map(vehicle => vehicle.type))]
      setCategories(["All", ...uniqueTypes])
    } catch (err) {
      console.error("Error fetching categories:", err)
      // Fallback to default categories if fetch fails
      setCategories(["All", "Sedan", "SUV", "Luxury"])
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await fetchCategories() // Add this line
      fetchVehicles() // Your existing function
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("vehicles")
          .select(`
            *,
            vehicle_variants ( available_quantity )
          `)
          .order("created_at", { ascending: false })
        if (error) throw error

        const enriched = (data || []).map((v) => {
          const variants = v.vehicle_variants || []
          const totalAvailable = variants.reduce(
            (sum, vv) => sum + (vv.available_quantity || 0),
            0
          )
          return {
            ...v,
            available: totalAvailable > 0,
            available_quantity: totalAvailable,
            total_quantity: variants.length,
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
    fetchVehicles()
  }, [])

  const handleCategoryClick = (category) => {
    setActiveCategory(category)
    setMenuOpen(false) // close menu after selecting
    if (category === "All") {
      setFilteredVehicles(vehicles)
    } else {
      setFilteredVehicles(vehicles.filter((v) => v.type === category))
    }
  }

  return (
    <section className="py-20 bg-[#F0F5F8]">
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

        {/* 🆕 Category Tabs */}
        <div className="mb-12">
          {/* Desktop Tabs */}
          <div className="hidden md:flex justify-center gap-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`pb-2 font-semibold text-lg relative ${
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

          {/* Mobile Burger */}
          <div className="md:hidden flex ">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-white shadow px-4 py-2 rounded-lg"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">
            {filteredVehicles.map((vehicle) => (
              <CarCard
                key={vehicle.id}
                car={vehicle}
                onRentClick={onRentClick}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ===========================
   FAQs
   =========================== */
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
  
    const toggleFAQ = (i) => setOpenIndex(openIndex === i ? null : i)
  
    return (
      <section className="bg-[#101010] text-white py-20 px-6 md:px-10 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">FAQs</h2>
            <p className="text-white text-lg">
              Have a question? We’ve got you covered. Here are some of our most frequently asked questions.
            </p>
          </div>
  
          <div className="space-y-6 divide-y divide-gray-700">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4 cursor-pointer" onClick={() => toggleFAQ(i)}>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  {openIndex === i ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                {openIndex === i && (
                  <p className="text-gray-300 mt-3 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
const ContactUs = () => {
  return (
    <section
      className="relative py-20 px-6 md:px-10 lg:px-20 text-gray-900"
      style={{
        backgroundImage: `url(${bgContact})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-white/0 "></div>

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        {/* Contact Details Box */}
        <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-xl p-8 space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            Have questions or need assistance with your booking? 
            Our friendly team is here to help you 24/7.
          </p>

          <div className="space-y-4 mt-6">
            <div className="flex items-center space-x-3">
              <MapPin className="h-6 w-6 text-gray-900" />
              <span className="text-lg">Cebu City, Philippines</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-6 w-6 text-gray-900" />
              <a href="tel:+639000000000" className="hover:underline text-lg">
                +63 900 000 0000
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-gray-900" />
              <a href="mailto:hello@rentalden.com" className="hover:underline text-lg">
                hello@rentalden.com
              </a>
            </div>
          </div>
        </div>

        {/* Map Box */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <iframe
            title="Rental Den Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62808.5234949729!2d123.8665!3d10.3157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9991b55555555%3A0xaaaaaaaaaaaaaaa!2sCebu%20City!5e0!3m2!1sen!2sph!4v1694700000000!5m2!1sen!2sph"
            width="100%"
            height="320"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
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
  const whyChooseUsRef = useRef(null)
  const aboutRef = useRef(null)
  const fleetRef = useRef(null)
  const faqRef = useRef(null)
  const contactRef = useRef(null)
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
    const { data, error } = await supabase.from("bookings").select("*").eq("status", "confirmed").order("id", { ascending: false })
    if (!error) setBookings(data || [])
  }
  useEffect(() => {
    fetchBookings()
  }, [])

  const handleRentClick = (car, variant = null) => {
    setSelectedCar(car)
    setSelectedVariant(variant)
    setIsDetailsOpen(false)   // if coming from details, close it
    setIsRentalOpen(true)     // always open rental form
  }
  

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCar(null)
  }
  const scrollToSection = (ref) => ref.current?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="min-h-screen bg-[#F0F5F8] flex flex-col">
     
      <Navbar onRentClick={() => handleRentClick()} scrollToSection={scrollToSection} refs={{ heroRef, whyChooseUsRef, aboutRef, fleetRef, faqRef, contactRef }} />

      <div ref={heroRef}><HeroSection /></div>
      <div ref={whyChooseUsRef}><WhyChooseUs /></div>
      <div ref={aboutRef}><AboutSection /></div>
      <HowItWorks />
      <div ref={fleetRef}>
      <FleetSection 
        onOpenDetails={handleOpenDetails} // 👈 pass handler
        onRentClick={handleRentClick}     // still pass, in case you also use buttons
      />

      </div>
      {/* Details Modal */}
      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        car={selectedCar}
        onRentClick={handleRentClick} // 👈 rent from inside details
      />
      <RentalBot/>



      

      {/* Rental Modal (form) */}
      <RentalModal
        isOpen={isRentalOpen}
        onClose={() => setIsRentalOpen(false)}
        selectedCar={selectedCar}
        selectedVariant={selectedVariant}
      />

      <div ref={faqRef}><FAQs /></div>
      <div ref={contactRef}><ContactUs /></div>

      {/* lil util for toast animation */}
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
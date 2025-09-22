// emailService.js - Place this in your services folder

const EMAIL_SERVICE_URL ='http://172.20.10.14:3002'; // Change this to your deployed email service URL

class EmailService {
  
  static async sendStatusUpdateEmail(booking, newStatus) {
    try {
      // Prepare email data
      const emailData = {
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        bookingId: booking.id,
        vehicleMake: booking.vehicles?.make || 'Vehicle',
        vehicleModel: booking.vehicles?.model || '',
        vehicleYear: booking.vehicles?.year || '',
        variantColor: booking.vehicle_variants?.color || '',
        rental_start_date: booking.rental_start_date,
        rental_end_date: booking.rental_end_date,
        pickup_location: booking.pickup_location || '',
        total_price: parseFloat(booking.total_price || 0),
        oldStatus: booking.status,
        newStatus: newStatus,
        updated_date: new Date().toISOString()
      };

      // Send to email service
      const response = await fetch(`${EMAIL_SERVICE_URL}/api/send-status-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Status update email sent successfully');
        return { success: true, message: 'Email sent successfully' };
      } else {
        console.error('Failed to send email:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: 'Network error or email service unavailable' };
    }
  }

  // Test if email service is running
  static async checkEmailService() {
    try {
      const response = await fetch(`${EMAIL_SERVICE_URL}/api/health`);
      const result = await response.json();
      return result.status === "Email service is running";
    } catch (error) {
      console.error('Email service health check failed:', error);
      return false;
    }
  }
}

export default EmailService;
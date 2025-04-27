import config from "@/lib/config"
import { logInfo, logError } from "@/lib/logging"

type EmailData = {
  to: string
  subject: string
  html: string
}

type BookingEmailData = {
  email: string
  name: string
  bookingId: string
  propertyTitle: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status?: string
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    // This is a placeholder for actual email sending logic
    // In a production environment, you would use a service like SendGrid, Mailgun, etc.
    logInfo("Email service", `Sending email to ${to} with subject: ${subject}`)

    // For now, we'll just log the email content and return success
    // In a real implementation, you would make an API call to your email service
    logInfo("Email service", "Email content:", { html: html.substring(0, 100) + "..." })

    return { success: true }
  } catch (error) {
    logError("Email service", "Error sending email:", { error })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export function generateBookingConfirmationEmail({
  email,
  name,
  bookingId,
  propertyTitle,
  checkIn,
  checkOut,
  totalPrice,
}: BookingEmailData) {
  const siteUrl = config.public.SITE_URL || "http://localhost:3000"
  const uploadUrl = `${siteUrl}/upload/${bookingId}`

  return {
    to: email,
    subject: "Your El Gouna Rentals Booking Confirmation",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E88E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #E6A65D; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; }
          .details { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
          .property-name { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for booking with El Gouna Rentals. Your booking request has been received and is awaiting payment confirmation.</p>
            
            <div class="details">
              <p class="property-name">${propertyTitle}</p>
              <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
              <p><strong>Total Price:</strong> $${totalPrice}</p>
            </div>
            
            <h2>Payment Instructions</h2>
            <p>Please send the total amount via Instapay to:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 15px 0;">
              <p style="font-weight: bold; margin: 0;">+20 123 456 7890</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Monzer El Gouna</p>
            </div>
            
            <p>After sending the payment, please upload your payment proof and ID documents using the button below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${uploadUrl}" class="button">Upload Documents</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us at support@elgounarentals.com.</p>
            
            <p>Best regards,<br>El Gouna Rentals Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} El Gouna Rentals. All rights reserved.</p>
            <p>El Gouna, Red Sea Governorate, Egypt</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export async function sendBookingConfirmationEmail(bookingData: BookingEmailData) {
  const emailData = generateBookingConfirmationEmail(bookingData)
  return sendEmail(emailData)
}

export function generateBookingStatusUpdateEmail({
  email,
  name,
  bookingId,
  propertyTitle,
  checkIn,
  checkOut,
  status,
}: BookingEmailData) {
  const siteUrl = config.public.SITE_URL || "http://localhost:3000"
  const statusCheckUrl = `${siteUrl}/booking-status/${bookingId}`

  let statusMessage = ""
  let subject = ""

  switch (status) {
    case "confirmed":
      subject = "Your El Gouna Rental Booking is Confirmed"
      statusMessage =
        "We're pleased to inform you that your booking has been confirmed. We look forward to welcoming you to El Gouna!"
      break
    case "cancelled":
      subject = "Your El Gouna Rental Booking has been Cancelled"
      statusMessage =
        "We regret to inform you that your booking has been cancelled. If you have any questions, please contact our support team."
      break
    case "completed":
      subject = "Thank You for Staying with El Gouna Rentals"
      statusMessage =
        "Thank you for choosing El Gouna Rentals. We hope you enjoyed your stay and would love to welcome you back in the future!"
      break
    default:
      subject = "Update on Your El Gouna Rental Booking"
      statusMessage = `Your booking status has been updated to: ${status?.replace("_", " ").toUpperCase() || "UPDATED"}`
  }

  return {
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E88E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #E6A65D; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; }
          .details { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
          .property-name { font-size: 18px; font-weight: bold; }
          .status { font-weight: bold; color: #1E88E5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            
            <p>${statusMessage}</p>
            
            <div class="details">
              <p class="property-name">${propertyTitle}</p>
              <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
              <p><strong>Current Status:</strong> <span class="status">${status?.replace("_", " ").toUpperCase() || "UPDATED"}</span></p>
            </div>
            
            <p>You can check your booking status anytime using the link below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${statusCheckUrl}" class="button">Check Booking Status</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us at support@elgounarentals.com.</p>
            
            <p>Best regards,<br>El Gouna Rentals Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} El Gouna Rentals. All rights reserved.</p>
            <p>El Gouna, Red Sea Governorate, Egypt</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export async function sendBookingStatusUpdateEmail(bookingData: BookingEmailData) {
  const emailData = generateBookingStatusUpdateEmail(bookingData)
  return sendEmail(emailData)
}

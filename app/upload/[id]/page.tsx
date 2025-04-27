import { redirect } from "next/navigation"

export default async function UploadPage({ params }: { params: { id: string } }) {
  const bookingId = params.id

  // Redirect to the booking status page
  redirect(`/booking-status/${bookingId}`)
}

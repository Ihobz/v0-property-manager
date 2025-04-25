import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">El Gouna Rentals</h3>
            <p className="text-gray-600">
              Find your perfect vacation rental in El Gouna, Egypt. Luxury villas, apartments, and more.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gouna-blue">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/properties" className="text-gray-600 hover:text-gouna-blue">
                  Properties
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gouna-blue">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gouna-blue">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="not-italic text-gray-600">
              <p>El Gouna, Red Sea Governorate</p>
              <p>Egypt</p>
              <p className="mt-2">Email: info@elgounarentals.com</p>
              <p>Phone: +20 123 456 7890</p>
            </address>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {currentYear} El Gouna Rentals. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

"use client"

import Link from "next/link"

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <span className="text-3xl font-bold tracking-wider text-black" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            FURNISPACE
          </span>
          <p className="text-gray-500 mt-3 text-sm">
            Authentication is not required
          </p>
        </div>
        <p className="text-center text-gray-500 text-sm mb-8">
          This application uses localStorage to save your designs. No account needed!
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/shop">
            <button className="w-full bg-black text-white py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              Browse Shop
            </button>
          </Link>
          <Link href="/">
            <button className="w-full border border-gray-200 text-gray-700 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

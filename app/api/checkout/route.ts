import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
})

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json()

    console.log("Creating checkout session for items:", items)
    console.log("Origin:", req.nextUrl.origin)

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      )
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.category || "Furniture",
          images: item.imageUrl && item.imageUrl.startsWith('http') ? [item.imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    console.log("Line items:", JSON.stringify(lineItems, null, 2))

    const successUrl = `${req.nextUrl.origin}/cart?success=true`
    const cancelUrl = `${req.nextUrl.origin}/cart?canceled=true`
    
    console.log("Success URL:", successUrl)
    console.log("Cancel URL:", cancelUrl)

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    console.log("Checkout session created:", session.id)
    console.log("Checkout URL:", session.url)

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    console.error("Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: error.message || "Failed to create checkout session", 
        details: error.type,
        code: error.code 
      },
      { status: 500 }
    )
  }
}

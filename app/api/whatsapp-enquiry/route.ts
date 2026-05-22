import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnquiryPayload = {
  name?: string;
  email?: string;
  phone?: string;
  guests?: string;
  property?: string;
  dates?: string;
  message?: string;
  sourcePage?: string;
  submittedAt?: string;
};

function cleanText(value: unknown, fallback = "Not provided") {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalized || fallback;
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildWhatsAppMessage(payload: EnquiryPayload) {
  const name = cleanText(payload.name, "Anonymous");
  const email = cleanText(payload.email);
  const phone = cleanText(payload.phone);
  const guests = cleanText(payload.guests);
  const property = cleanText(payload.property);
  const dates = cleanText(payload.dates);
  const notes = cleanText(payload.message);
  const sourcePage = cleanText(payload.sourcePage);
  const submittedAt = cleanText(payload.submittedAt);

  return [
    "📩 New Enquiry Received",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Guests: ${guests}`,
    `Listing: ${property}`,
    `Dates: ${dates}`,
    `Message: ${notes}`,
    "",
    `Source page: ${sourcePage}`,
    `Submitted at: ${submittedAt}`
  ].join("\n");
}

export async function POST(request: Request) {
  let payload: EnquiryPayload;
  try {
    payload = (await request.json()) as EnquiryPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = cleanText(payload.name, "");
  const email = cleanText(payload.email, "");
  if (!name || !email) {
    return NextResponse.json(
      { ok: false, error: "Name and email are required." },
      { status: 400 }
    );
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipientRaw = process.env.WHATSAPP_RECIPIENT_NUMBER;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!accessToken || !phoneNumberId || !recipientRaw) {
    return NextResponse.json(
      {
        ok: false,
        error: "WhatsApp API is not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_RECIPIENT_NUMBER."
      },
      { status: 500 }
    );
  }

  const recipientNumber = normalizePhoneNumber(recipientRaw);
  if (!recipientNumber) {
    return NextResponse.json(
      { ok: false, error: "WHATSAPP_RECIPIENT_NUMBER is invalid." },
      { status: 500 }
    );
  }

  const whatsappPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: "text",
    text: {
      preview_url: false,
      body: buildWhatsAppMessage(payload)
    }
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(whatsappPayload),
        cache: "no-store"
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error?.message || "WhatsApp API request failed."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: data?.messages?.[0]?.id || null
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to reach WhatsApp API." },
      { status: 502 }
    );
  }
}

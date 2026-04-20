const META_PIXEL_ID = process.env.META_PIXEL_ID || "1977031942900826";
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_GRAPH_API_VERSION = "v20.0";

function getBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return req.socket?.remoteAddress || "";
}

async function sendMetaEvent(req, eventName) {
  const body = getBody(req);

  if (!META_CAPI_ACCESS_TOKEN) {
    return { status: 202, payload: { ok: false, configured: false } };
  }

  const eventId = body.eventId || `${eventName.toLowerCase()}_${Date.now()}`;
  const userData = {
    client_user_agent: req.headers["user-agent"] || "",
  };

  const clientIp = getClientIp(req);
  if (clientIp) {
    userData.client_ip_address = clientIp;
  }

  if (body.fbp) {
    userData.fbp = body.fbp;
  }

  if (body.fbc) {
    userData.fbc = body.fbc;
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: body.sourceUrl || req.headers.referer || "",
    user_data: userData,
  };

  if (eventName === "InitiateCheckout") {
    event.custom_data = {
      content_name: body.kitTitle || "Kit Progressiva Vegetal Havana",
      content_category: "Progressiva Vegetal Havana",
      currency: body.currency || "BRL",
      value: typeof body.value === "number" ? body.value : undefined,
      checkout_url: body.checkoutUrl || undefined,
    };
  }

  try {
    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      },
    );

    return {
      status: metaResponse.ok ? 200 : 202,
      payload: { ok: metaResponse.ok, configured: true },
    };
  } catch {
    return { status: 202, payload: { ok: false, configured: true } };
  }
}

function handleMetaEvent(req, res, eventName) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  sendMetaEvent(req, eventName).then(({ status, payload }) => {
    res.status(status).json(payload);
  });
}

module.exports = { handleMetaEvent };

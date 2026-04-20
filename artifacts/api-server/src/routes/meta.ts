import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();

const META_PIXEL_ID = process.env.META_PIXEL_ID || "1977031942900826";
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_GRAPH_API_VERSION = "v20.0";

type MetaEventBody = {
  eventId?: string;
  sourceUrl?: string;
  fbp?: string | null;
  fbc?: string | null;
  kitTitle?: string;
  checkoutUrl?: string;
  value?: number;
  currency?: string;
};

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return req.ip;
}

async function sendMetaEvent(req: Request, eventName: string, body: MetaEventBody) {
  if (!META_CAPI_ACCESS_TOKEN) {
    req.log.warn("Meta CAPI token is not configured");
    return { ok: false, configured: false };
  }

  const eventId = body.eventId || `${eventName.toLowerCase()}_${Date.now()}`;
  const userData: Record<string, string> = {
    client_user_agent: req.get("user-agent") || "",
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

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: body.sourceUrl || req.get("referer") || "",
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

  const metaResponse = await fetch(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
    },
  );

  if (!metaResponse.ok) {
    const errorBody = await metaResponse.text();
    req.log.error(
      { eventName, status: metaResponse.status, errorBody },
      "Meta CAPI event failed",
    );
    return { ok: false, configured: true };
  }

  return { ok: true, configured: true };
}

router.post("/meta/page-view", async (req, res) => {
  try {
    const result = await sendMetaEvent(req, "PageView", req.body as MetaEventBody);
    res.status(result.ok ? 200 : 202).json(result);
  } catch (err) {
    req.log.error({ err }, "Meta CAPI PageView request failed");
    res.status(202).json({ ok: false, configured: true });
  }
});

router.post("/meta/initiate-checkout", async (req, res) => {
  try {
    const result = await sendMetaEvent(
      req,
      "InitiateCheckout",
      req.body as MetaEventBody,
    );
    res.status(result.ok ? 200 : 202).json(result);
  } catch (err) {
    req.log.error({ err }, "Meta CAPI InitiateCheckout request failed");
    res.status(202).json({ ok: false, configured: true });
  }
});

export default router;

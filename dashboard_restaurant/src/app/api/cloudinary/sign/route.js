// src/app/api/cloudinary/sign/route.js
import { v2 as cloudinary } from "cloudinary";
export const runtime = "nodejs";

cloudinary.config({ secure: true }); // อ่านจาก CLOUDINARY_URL อัตโนมัติ

// GET: ใช้เทสในเบราว์เซอร์
export async function GET() {
    try {
    cloudinary.config({ secure: true });
    const cfg = cloudinary.config();
    return Response.json({
      ok: true,
      cloud: cfg.cloud_name,
      apiKeyPreview: String(cfg.api_key).slice(0,4) + "...", // mask
    });
    } catch (e) {
      return Response.json({ ok:false, error:e.message }, { status:500 });
    }
}

// POST: ให้ฟรอนต์มาขอลายเซ็นก่อนอัปโหลด
export async function POST(req) {
  const { folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "uploads" } = await req.json();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp};

  const signature = cloudinary.utils.api_sign_request(
    params,
    cloudinary.config().api_secret
  );

  return Response.json({
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    timestamp,
    folder: null,
    signature,
  });
}

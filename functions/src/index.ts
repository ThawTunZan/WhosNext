const functions = require("firebase-functions");
const cloudinary = require("cloudinary").v2;
const admin = require("firebase-admin");

const cors = require("cors");

admin.initializeApp();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const corsHandler = cors({ origin: true });

exports.deleteCloudinaryImage = functions.https.onRequest((req: any, res: any) => {

  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }


    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: "Missing public_id" });
    }

    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return res.status(200).json({ success: true, result });
    } catch (err) {
      console.error("Cloudinary deletion error:", err);
      return res.status(500).json({ error: "Cloudinary deletion failed" });
    }
  });
});
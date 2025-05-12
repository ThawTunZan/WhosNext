export const deleteReceipt = async (public_id: string): Promise<boolean> => {
  try {
    const res = await fetch("https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/deleteCloudinaryImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return false;
  }
};

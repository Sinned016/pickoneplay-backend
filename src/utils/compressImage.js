import sharp from "sharp";

export const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize(800, 800, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 75,
    })
    .toBuffer();
};

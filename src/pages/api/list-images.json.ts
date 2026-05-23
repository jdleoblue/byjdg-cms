import fs from "fs";
import path from "path";

export async function GET() {
  const imagesDir = path.join(process.cwd(), "public/images");

  const files = fs
    .readdirSync(imagesDir)
    .filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

  return new Response(
    JSON.stringify({
      images: files.map(
        (file) => `/images/${file}`
      ),
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
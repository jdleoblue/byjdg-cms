import type { APIRoute } from "astro";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No image uploaded." }),
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.-]/g, "");

    const filePath = path.join(
      process.cwd(),
      "public",
      "images",
      safeName
    );

    await writeFile(filePath, buffer);

    return new Response(
      JSON.stringify({
        success: true,
        imagePath: `/images/${safeName}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Image upload failed." }),
      { status: 500 }
    );
  }
};
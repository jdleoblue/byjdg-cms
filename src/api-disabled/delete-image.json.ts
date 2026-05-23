import type { APIRoute } from "astro";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const imagePath = data.imagePath;

    if (!imagePath || !imagePath.startsWith("/images/")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid image path.",
        }),
        { status: 400 }
      );
    }

    const fileName = path.basename(imagePath);

    const filePath = path.join(
      process.cwd(),
      "public",
      "images",
      fileName
    );

    await unlink(filePath);

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not delete image.",
      }),
      { status: 500 }
    );
  }
};
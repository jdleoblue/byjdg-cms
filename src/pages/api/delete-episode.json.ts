import type { APIRoute } from "astro";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing slug",
        }),
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "episodes",
      `${slug}.json`
    );

    await unlink(filePath);

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not delete episode",
      }),
      { status: 500 }
    );
  }
};
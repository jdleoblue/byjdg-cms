import type { APIRoute } from "astro";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const slug = data.slug?.trim();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug is required." }),
        { status: 400 }
      );
    }

    const episode = {
      episode: data.episode || "",
      title: data.title || "",
      slug,
      description: data.description || "",
      youtube: data.youtube || "",
      image: data.image || "",
      content: data.content || "",
      metaTitle: data.metaTitle || data.title || "",
      metaDescription: data.metaDescription || data.description || "",
      status: "Draft",
    };

    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "episodes",
      `${slug}.json`
    );

    await writeFile(filePath, JSON.stringify(episode, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Episode created.",
        slug,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Could not create episode." }),
      { status: 500 }
    );
  }
};
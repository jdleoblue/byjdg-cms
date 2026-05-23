import type { APIRoute } from "astro";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const slug = data.slug?.trim();

    if (!slug) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Slug is required.",
        }),
        { status: 400 }
      );
    }

    const episodesDir = path.join(
      process.cwd(),
      "src",
      "content",
      "episodes"
    );

    const files = await readdir(episodesDir);

    let existingFilePath = "";

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const filePath = path.join(episodesDir, file);
      const fileContent = await readFile(filePath, "utf-8");
      const episodeData = JSON.parse(fileContent);

      if (episodeData.slug?.trim() === slug) {
        existingFilePath = filePath;
        break;
      }
    }

    if (!existingFilePath) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not find existing episode file.",
        }),
        { status: 404 }
      );
    }

    const episode = {
      episode: data.episode || "",
      title: data.title || "",
      slug,
      description: data.description || "",
      image: data.image || "",
      youtube: data.youtube || "",
      content: data.content || "",
      status: data.status || "Published",
      metaTitle: data.metaTitle || data.title || "",
      metaDescription: data.metaDescription || data.description || "",
    };

    await writeFile(existingFilePath, JSON.stringify(episode, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Episode updated.",
        slug,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not update episode.",
      }),
      { status: 500 }
    );
  }
};
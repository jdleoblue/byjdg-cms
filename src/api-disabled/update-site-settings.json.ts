import type { APIRoute } from "astro";
import { writeFile } from "node:fs/promises";
import path from "node:path";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const settings = {
      heroEyebrow: data.heroEyebrow || "",
      heroTitle: data.heroTitle || "",
      heroSubtitle: data.heroSubtitle || "",
      heroImage: data.heroImage || "",

      filmsTitle: data.filmsTitle || "",
      filmsDescription: data.filmsDescription || "",

      footerBrand: data.footerBrand || "",
      footerText: data.footerText || "",
      youtubeUrl: data.youtubeUrl || "",
      instagramUrl: data.instagramUrl || "",
      emailAddress: data.emailAddress || "",

      siteTitle: data.siteTitle || "",
      siteDescription: data.siteDescription || "",
    };

    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "settings",
      "site.json"
    );

    await writeFile(filePath, JSON.stringify(settings, null, 2));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not update site settings.",
      }),
      { status: 500 }
    );
  }
};
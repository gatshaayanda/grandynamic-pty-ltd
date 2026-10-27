import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grandynamic Pty Ltd",
    short_name: "Grandynamic",
    description: "Welding, steel fabrication and custom metalwork in Botswana. Describe your project and request a quotation.",
    start_url: "/",
    display: "standalone",
    background_color: "#d45113",
    theme_color: "#d45113",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "construction"],
    icons: [
      { src: "/grandynamic-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/grandynamic-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}

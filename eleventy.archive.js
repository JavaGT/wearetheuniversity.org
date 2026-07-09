const { DateTime } = require("luxon");
const { addSharedAssets } = require("./shared/eleventy-shared");

/** Research archive: archive.wearetheuniversity.org */
module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

  // Only the research archive + shared chrome
  eleventyConfig.ignores.add("**/blog/**");
  eleventyConfig.ignores.add("**/pages/**");
  eleventyConfig.ignores.add("**/arcade/**");
  eleventyConfig.ignores.add("**/404.njk");

  addSharedAssets(eleventyConfig);
  eleventyConfig.addPassthroughCopy({ attachments: "attachments" });

  eleventyConfig.addGlobalData("site", {
    name: "WATU Archive",
    shortName: "WATU ARCHIVE",
    url: "https://archive.wearetheuniversity.org",
    kind: "archive",
    isArchive: true,
    isBlog: false,
    wwwUrl: "https://wearetheuniversity.org",
    blogUrl: "https://blog.wearetheuniversity.org",
    archiveUrl: "https://archive.wearetheuniversity.org",
  });

  function isArchiveIndex(item) {
    const p = item.inputPath.replace(/\\/g, "/");
    return (
      p.endsWith("/archive/index.md") ||
      p.includes("/archive/_") ||
      p.includes("/archive/years/") ||
      p.includes("/archive/sources/")
    );
  }

  eleventyConfig.addCollection("archive", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("source/archive/**/*.md")
      .filter((item) => !isArchiveIndex(item));
  });

  eleventyConfig.addCollection("archiveYears", function (collectionApi) {
    const items = collectionApi
      .getFilteredByGlob("source/archive/**/*.md")
      .filter((item) => !isArchiveIndex(item));

    const byYear = new Map();
    for (const item of items) {
      const year = item.date
        ? DateTime.fromJSDate(item.date, { zone: "utc" }).toFormat("yyyy")
        : "unknown";
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(item);
    }

    return [...byYear.entries()]
      .map(([year, yearItems]) => ({
        year,
        items: yearItems.sort((a, b) => b.date - a.date),
        count: yearItems.length,
      }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)));
  });

  eleventyConfig.addCollection("archiveSources", function (collectionApi) {
    const items = collectionApi
      .getFilteredByGlob("source/archive/**/*.md")
      .filter((item) => !isArchiveIndex(item));

    const labels = {
      scoop: "Scoop.co.nz mirror",
      direct: "Direct / curated",
      "uoa-news-opinions-notices": "UoA news, opinions, notices",
      "uoa-vc-updates": "Vice-Chancellor updates",
      "uoa-staff-communications": "UoA staff communications",
      "uoa-council": "UoA Council",
      "teu-auckland-university-emails": "TEU Auckland emails",
    };

    const bySource = new Map();
    for (const item of items) {
      const parts = item.inputPath.replace(/\\/g, "/").split("/");
      const archiveIdx = parts.lastIndexOf("archive");
      const source = parts[archiveIdx + 1] || "other";
      if (!bySource.has(source)) bySource.set(source, []);
      bySource.get(source).push(item);
    }

    return [...bySource.entries()]
      .map(([source, sourceItems]) => ({
        source,
        label: labels[source] || source,
        items: sourceItems.sort((a, b) => b.date - a.date),
        count: sourceItems.length,
      }))
      .sort((a, b) => b.count - a.count);
  });

  // Empty blog collection for shared layout safety
  eleventyConfig.addCollection("blog", () => []);

  return {
    dir: {
      input: "source",
      output: "dist/archive",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};

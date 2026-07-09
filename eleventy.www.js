const { DateTime } = require("luxon");
const { addSharedAssets } = require("./shared/eleventy-shared");

/** Apex site: wearetheuniversity.org — organising hub (no blog/archive bodies). */
module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

  // Subdomain hosts own these
  eleventyConfig.ignores.add("**/archive/**");
  eleventyConfig.ignores.add("**/blog/**");

  eleventyConfig.addPassthroughCopy({ "source/arcade": "arcade" });
  addSharedAssets(eleventyConfig);

  eleventyConfig.addGlobalData("site", {
    name: "We Are The University",
    shortName: "WEARETHEUNIVERSITY",
    url: "https://wearetheuniversity.org",
    kind: "www",
    isArchive: false,
    isBlog: false,
    wwwUrl: "https://wearetheuniversity.org",
    blogUrl: "https://blog.wearetheuniversity.org",
    archiveUrl: "https://archive.wearetheuniversity.org",
  });

  eleventyConfig.addCollection("blog", () => []);
  eleventyConfig.addCollection("archive", () => []);

  eleventyConfig.addCollection("arcade", function (collectionApi) {
    return collectionApi.getFilteredByGlob("source/arcade/*/index.html");
  });

  eleventyConfig.addCollection("pages", function (collectionApi) {
    return collectionApi.getFilteredByGlob(["source/pages/*.md"]);
  });

  return {
    dir: {
      input: "source",
      output: "docs",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};

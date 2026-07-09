const { DateTime } = require("luxon");
const { addSharedAssets } = require("./shared/eleventy-shared");

/** Campaign blog: blog.wearetheuniversity.org */
module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

  eleventyConfig.ignores.add("**/archive/**");
  eleventyConfig.ignores.add("**/pages/**");
  eleventyConfig.ignores.add("**/arcade/**");
  eleventyConfig.ignores.add("**/404.njk");

  addSharedAssets(eleventyConfig);

  eleventyConfig.addGlobalData("site", {
    name: "WATU Blog",
    shortName: "WATU BLOG",
    url: "https://blog.wearetheuniversity.org",
    kind: "blog",
    isArchive: false,
    isBlog: true,
    wwwUrl: "https://wearetheuniversity.org",
    blogUrl: "https://blog.wearetheuniversity.org",
    archiveUrl: "https://archive.wearetheuniversity.org",
  });

  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("source/blog/**/*.md")
      .filter((item) => !item.inputPath.endsWith("/index.md"));
  });

  eleventyConfig.addCollection("archive", () => []);

  return {
    dir: {
      input: "source",
      output: "dist/blog",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};

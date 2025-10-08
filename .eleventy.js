const { DateTime } = require("luxon");
module.exports = function(eleventyConfig) {
  // Add a date filter for Nunjucks
  eleventyConfig.addFilter("date", (dateObj, format = "yyyy-MM-dd") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });
  // Copy HTML games as-is
  eleventyConfig.addPassthroughCopy({ "source/arcade": "arcade" });

  // Do NOT copy .eml files or archive/emails directory
  // Only copy attachments if needed (uncomment if you want to copy attachments)
  // eleventyConfig.addPassthroughCopy({ "attachments": "attachments" });

  // Copy style.css to output
  eleventyConfig.addPassthroughCopy({ "source/style.css": "style.css" });


  // Markdown: blog, archive, root-level pages
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByGlob("source/blog/**/*.md");
  });
  eleventyConfig.addCollection("archive", function(collectionApi) {
    // Only include .md files, not .eml
    return collectionApi.getFilteredByGlob(["source/archive/**/*.md"]);
  });

  // Arcade games: find all index.html in arcade subfolders
  eleventyConfig.addCollection("arcade", function(collectionApi) {
    return collectionApi.getFilteredByGlob("source/arcade/*/index.html");
  });

  // Root-level pages
  eleventyConfig.addCollection("pages", function(collectionApi) {
    return collectionApi.getFilteredByGlob(["source/pages/*.md"]);
  });

  return {
    dir: {
      input: "source",
      output: "docs"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};

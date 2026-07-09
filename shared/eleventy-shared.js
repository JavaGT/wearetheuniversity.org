/**
 * Shared Eleventy helpers for www / blog / archive configs.
 */
const path = require("path");

const SHARED_STYLE = path.join(__dirname, "style.css");

function addSharedAssets(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ [SHARED_STYLE]: "style.css" });
}

module.exports = { addSharedAssets, SHARED_STYLE };

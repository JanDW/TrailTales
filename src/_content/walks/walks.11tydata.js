export default (data) => ({
  layout: 'walks.webc',
  eleventyComputed: {
    permalink: (data) => `/walks/${data.page.fileSlug}/index.html`,
  },
});

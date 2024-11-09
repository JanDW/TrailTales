const getPermalink = (data) => {
  // console.log(data);
  let permalink;
  if (data.page.fileSlug === 'walks') {
    return (permalink = `/walks/index.html`);
  }
  return (permalink = `/walks/${data.page.fileSlug}/index.html`);
};

export default (data) => ({
  layout: 'walks.webc',
  eleventyComputed: {
    permalink: (data) => getPermalink(data),
  },
});

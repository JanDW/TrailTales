import markdownIt from 'markdown-it';
import bundlerPlugin from '@11ty/eleventy-plugin-bundle';
import webCPlugin from '@11ty/eleventy-plugin-webc';
import prettier from './src/transforms/prettier.js';
import yaml from 'js-yaml';
let formatTitle;

export default function (eleventyConfig) {
  const mdOptions = {
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
  };

  const markdownLib = markdownIt(mdOptions);

  eleventyConfig.setLibrary('md', markdownLib);
  eleventyConfig.setUseGitIgnore(true);

  // Passthroughs
  const stuffToCopy = [
    'src/assets/styles/styles.css',
    'src/assets/images',
    'src/assets/files',
    'src/assets/fonts',
    { 'src/assets/siteroot': '/' },
    { 'node_modules/leaflet/dist': '/assets/scripts/leaflet' },
    { 'node_modules/leaflet-gpx': '/assets/scripts/leaflet-gpx' },
  ];

  stuffToCopy.forEach((stuff) => {
    eleventyConfig.addPassthroughCopy(stuff);
  });

  // Shortcodes
  eleventyConfig.addPairedShortcode('markdown', (content) => {
    return markdownLib.render(content);
  });

  /** Maps a config of attribute-value pairs to an HTML string
   * representing those same attribute-value pairs.
   */
  const stringifyAttributes = (attributeMap) => {
    return Object.entries(attributeMap)
      .map(([attribute, value]) => {
        if (typeof value === 'undefined') return '';
        return `${attribute}="${value}"`;
      })
      .join(' ');
  };

  const imageShortcode = async (
    src,
    alt,
    className = undefined,
    // Corresponds to TailwindCSS breakpoints of sm,md,lg,xl,2xl
    widths = [640, 768, 1024, 1280, 1536],
    // list optimized formats first so that their source tags appear first in the rendered markup
    formats = ['webp', 'jpeg'],
    sizes = '100vw'
  ) => {
    const imageMetadata = await Image(src, {
      widths: [...widths, null],
      formats: [...formats, null],
      outputDir: './www/assets/img',
      urlPath: '/assets/img/',
      filenameFormat: function (hash, src, width, format, options) {
        const { name } = path.parse(src);
        return `${name}-${width}-${hash}.${format}`;
      },
    });
    const imageAttributes = {
      alt,
      sizes,
      loading: 'lazy',
      decoding: 'async',
    };

    return Image.generateHTML(imageMetadata, imageAttributes);
  };

  // Plugins

  eleventyConfig.addPlugin(bundlerPlugin);
  eleventyConfig.addPlugin(webCPlugin, {
    components: 'src/_includes/components/**/*.webc',
  });

  eleventyConfig.addFilter('toHeading', function (value) {
    // Split the string on camelCase boundaries, then capitalize the first letter of each word
    let result = value
      .split(/(?=[A-Z])/)
      .map((word) => word.toLowerCase())
      .join(' ');

    // Ensure the first letter of the result is capitalized
    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
  });

  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(
      'MMMM d, yyyy'
    );
  });

  // Filter that converts 2023-12-26 to Dec 26
  eleventyConfig.addFilter('shortDate', (dateStr) => {
    return DateTime.fromISO(dateStr, { zone: 'utc' }).toFormat('MMM dd');
  });

  eleventyConfig.addFilter('commaNumber', function (value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  });

  eleventyConfig.addFilter('formatTitle', function (value) {
    return formatTitle(value);
  });

  eleventyConfig.addFilter('groupByYear', function (items) {
    let result = {};
    items.forEach((item) => {
      let year = item.year;
      if (!result[year]) {
        result[year] = [];
      }
      result[year].push(item);
    });
    return result;
  });

  eleventyConfig.addFilter('sortObjectByKeysDesc', function (obj) {
    return Object.keys(obj)
      .sort()
      .reverse()
      .map((key) => ({ year: key, grants: obj[key] }));
  });

  eleventyConfig.addNunjucksFilter('getData', function (value) {
    return this.ctx[value];
  });

  eleventyConfig.addNunjucksFilter('merge', function (obj1, obj2) {
    return { ...obj1, ...obj2 };
  });

  eleventyConfig.addNunjucksFilter('limit', function (arr, start = 0, end) {
    return arr.slice(start, end);
  });

  // Add Custom Data Extensions YAML
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

  // Transforms
  eleventyConfig.addTransform('prettier', prettier);

  // Shortcodes
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);

  // Add Custom Data Extensions YAML
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

  return {
    dir: {
      // ⚠️ These values are both relative to your input directory.
      includes: '_includes',
      layouts: '_layouts',
      input: 'src',
      output: 'www',
    },
    templateFormats: ['md', 'html', 'webc'],
    markdownTemplateEngine: 'webc',
    htmlTemplateEngine: 'webc',
    dataTemplateEngine: 'webc',
  };
}
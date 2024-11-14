import markdownIt from 'markdown-it';
import webCPlugin from '@11ty/eleventy-plugin-webc';
import prettier from './src/transforms/prettier.js';
import { EleventyRenderPlugin } from '@11ty/eleventy';
import EleventyFetch from '@11ty/eleventy-fetch';
import yaml from 'js-yaml';
import exifr from 'exifr';

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

  // Shouldn't have to add this, but walks.11tydata.js is being copied to the output directory @FIX
  eleventyConfig.ignores.add('**/*.11tydata.js');

  // Passthroughs
  const stuffToCopy = [
    'src/assets/styles/styles.css',
    'src/assets/images',
    'src/assets/files',
    'src/assets/fonts',
    { 'src/assets/siteroot': '/' },
    { 'node_modules/leaflet/dist': '/assets/scripts/leaflet' },
    { 'node_modules/leaflet-gpx': '/assets/scripts/leaflet-gpx' },
    { 'src/_data/images': 'assets/images' },
  ];

  stuffToCopy.forEach((stuff) => {
    eleventyConfig.addPassthroughCopy(stuff);
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

  // Plugins
  eleventyConfig.addPlugin(webCPlugin, {
    components: [
      'src/_includes/components/**/*.webc',
      'npm:@11ty/eleventy-img/*.webc,',
    ],
  });

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Add Custom Data Extensions YAML
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));
  eleventyConfig.addDataExtension('png,jpeg', {
    parser: async (file) => {
      let exif = await exifr.parse(file, true); //pass true to get all metadata

      return {
        exif,
      };
    },
    // Using `read: false` changes the parser argument to
    // a file path instead of file contents.
    read: false,
  });

  // Transforms
  eleventyConfig.addTransform('prettier', prettier);

  return {
    dir: {
      // ⚠️ These values are both relative to your input directory.
      includes: '_includes',
      layouts: '_layouts',
      input: 'src',
      output: 'www',
    },
    templateFormats: ['webc', 'js', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}

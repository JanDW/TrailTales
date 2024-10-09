import prettier from "prettier";

export default function (content) {
  if (this.outputPath && this.outputPath.endsWith(".html")) {
    return prettier.format(content, { parser: "html" });
  }
  return content;
}

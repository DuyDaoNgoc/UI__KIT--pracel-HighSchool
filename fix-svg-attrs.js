// fix-svg-attrs.js
const fs = require("fs");
const path = require("path");

const exts = [".js", ".jsx", ".ts", ".tsx"];
const attrsMap = {
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-width": "strokeWidth",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
};

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

walk("./src", (file) => {
  if (!exts.includes(path.extname(file))) return;

  let content = fs.readFileSync(file, "utf8");
  let updated = content;

  for (const [wrong, correct] of Object.entries(attrsMap)) {
    const regex = new RegExp(wrong, "g");
    updated = updated.replace(regex, correct);
  }

  if (updated !== content) {
    fs.writeFileSync(file, updated, "utf8");
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log("🎉 SVG attribute fix done!");

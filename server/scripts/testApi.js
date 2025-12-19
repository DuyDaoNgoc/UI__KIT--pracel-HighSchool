const https = require("https");
const http = require("http");

const url =
  "http://localhost:8000/api/timetables/class/6938d84237837ca8740e9804";

http
  .get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        console.log("📦 API RESPONSE:");
        console.log(JSON.stringify(json, null, 2));
        console.log("\n🔍 SCHEDULE ITEM 0:");
        if (json.data?.schedule?.[0]) {
          console.log(JSON.stringify(json.data.schedule[0], null, 2));
        }
      } catch (e) {
        console.error("Parse error:", e.message);
      }
    });
  })
  .on("error", (e) => {
    console.error("Request error:", e.message);
  });

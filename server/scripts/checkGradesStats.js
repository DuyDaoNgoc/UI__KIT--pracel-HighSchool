// server/scripts/checkGradesStats.js
// Usage:
//   node server/scripts/checkGradesStats.js <BASE_URL> <TOKEN>
//   or set env: API_TOKEN / TOKEN and BASE_URL
// Example:
//   node server/scripts/checkGradesStats.js http://localhost:8000 "Bearer eyJ..."
// Notes:
//   - Token may be just the JWT or prefixed with "Bearer ".
//   - If token is missing or clearly a placeholder (like "Bearer <YOUR_TOKEN>"), the script
//     will print instructions and exit. Use --no-auth to attempt unauthenticated requests.

const axios = require("axios");

function usageAndExit() {
  console.log("\nUsage:");
  console.log("  node server/scripts/checkGradesStats.js <BASE_URL> <TOKEN>");
  console.log("  OR set env vars: BASE_URL, API_TOKEN (or TOKEN)");
  console.log("Example:");
  console.log(
    '  node server/scripts/checkGradesStats.js http://localhost:8000 "Bearer eyJ..."',
  );
  console.log(
    "\nIf you have a token in browser localStorage, open DevTools and run: localStorage.getItem('token')\n",
  );
  process.exit(1);
}

async function fetchJson(instance, url, opts = {}) {
  try {
    const res = await instance.get(url, opts);
    return { ok: true, res };
  } catch (e) {
    return { ok: false, err: e };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const base = args[0] || process.env.BASE_URL || "http://localhost:8000";
  let token = args[1] || process.env.API_TOKEN || process.env.TOKEN || null;
  const noAuth = args.includes("--no-auth");

  if (!token && !noAuth) {
    console.error(
      "Missing API token. Provide as 2nd argument or set API_TOKEN/TOKEN env var.",
    );
    usageAndExit();
  }

  if (token && token.includes("<YOUR_TOKEN")) {
    console.error(
      "Token appears to be a placeholder. Replace <YOUR_TOKEN> with a real token from localStorage.",
    );
    usageAndExit();
  }

  // Ensure 'Bearer ' prefix if token looks like a bare JWT (heuristic)
  if (token && !token.startsWith("Bearer ") && token.split(".").length === 3) {
    token = `Bearer ${token}`;
  }

  const instance = axios.create({
    baseURL: base,
    headers: token ? { Authorization: token } : {},
    timeout: 20000,
  });

  try {
    const classesPath = "/api/classes/my-classes"; // prefer teacher-scoped route
    console.log(`Fetching classes from ${base}${classesPath}`);
    const cls = await fetchJson(instance, classesPath);
    if (!cls.ok) {
      const e = cls.err;
      console.error(
        "Failed to fetch classes:",
        e.response?.status,
        e.response?.data || e.message || e,
      );
      if (e.response && e.response.status === 403)
        console.error(
          "403: check that the token belongs to a teacher and has proper permissions.",
        );
      process.exit(2);
    }

    const classes = cls.res.data?.data || cls.res.data || [];
    console.log(`Found ${classes.length} classes`);

    for (const c of classes) {
      const id = c._id || c.classCode || JSON.stringify(c).slice(0, 40);
      console.log(
        "\n---\nClass:",
        id,
        c.classCode ? `(code: ${c.classCode})` : "",
      );

      // Statistics
      const stats = await fetchJson(instance, "/api/grades/statistics", {
        params: { classId: c._id },
      });
      if (stats.ok) {
        console.log(
          "/api/grades/statistics response:",
          JSON.stringify(stats.res.data, null, 2),
        );
      } else {
        const e = stats.err;
        console.error(
          "Error fetching statistics for class",
          id,
          "status:",
          e.response?.status || "(no status)",
        );
        if (e.response && e.response.data)
          console.error(
            "Response body:",
            JSON.stringify(e.response.data, null, 2),
          );
        else console.error(e.message || e);
      }

      // Grade docs
      const grades = await fetchJson(instance, "/api/grades", {
        params: { classId: c._id },
      });
      if (grades.ok) {
        const arr = grades.res.data?.data || grades.res.data || [];
        console.log("/api/grades response count:", arr.length);
        const sample = arr
          .slice(0, 5)
          .map((g) => ({
            _id: g._id,
            studentId: g.studentId,
            gradesCount: Array.isArray(g.grades) ? g.grades.length : 0,
            averageScore: g.averageScore,
          }));
        console.log("/api/grades sample:", JSON.stringify(sample, null, 2));
      } else {
        const e = grades.err;
        console.error(
          "Error fetching grade docs for class",
          id,
          "status:",
          e.response?.status || "(no status)",
        );
        if (e.response && e.response.data)
          console.error(
            "Response body:",
            JSON.stringify(e.response.data, null, 2),
          );
        else console.error(e.message || e);
      }
    }
  } catch (err) {
    console.error("Fatal error:", err.response?.status || err.message || err);
    process.exit(3);
  }
}

main();

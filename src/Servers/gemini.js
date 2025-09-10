import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_APIKEY, 
});

// ---- GitHub API Helper ----
const GITHUB_TOKEN = import.meta.env.VITE_GHTOKEN; 

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchRepoData({ repoUrl }) {
  const match = repoUrl.match(/github.com\/([^/]+)\/([^/]+)(?:$|\.|\/)/);
  if (!match) throw new Error("Invalid GitHub repo URL");

  const owner = match[1];
  const repo = match[2];

  // 1. Repo metadata
  const repoRes = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);

  // 2. Languages
  const langsRes = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/languages`
  );

  // 3. Project structure 
  let projectStructure = [];

  async function getStructure(owner, repo, path = "", prefix = "") {
    const contentsRes = await ghFetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    );

    if (!Array.isArray(contentsRes)) return [];

    let structure = [];
    const lastIndex = contentsRes.length - 1;

    for (let i = 0; i < contentsRes.length; i++) {
      const item = contentsRes[i];
      const isLast = i === lastIndex;

      const connector = isLast ? "└── " : "├── ";
      const newPrefix = prefix + (isLast ? "    " : "│   ");

      if (item.type === "dir") {
        structure.push(`${prefix}${connector}📂 ${item.name}/`);
        const children = await getStructure(
          owner,
          repo,
          `${path}${item.name}/`,
          newPrefix
        );
        structure = structure.concat(children);
      } else if (item.type === "file") {
        structure.push(`${prefix}${connector}📄 ${item.name}`);
      }
    }

    return structure;
  }

  try {
    projectStructure = await getStructure(owner, repo);
  } catch (error) {
    console.warn(`Failed to get project structure: ${error.message}`);
    projectStructure = ["Project structure unavailable due to API limitations"];
  }


  return {
    owner,
    repo,
    name: repoRes.name,
    full_name: repoRes.full_name,
    description: repoRes.description,
    repo_url: repoRes.html_url,
    license: repoRes.license ? repoRes.license.spdx_id : "unlicensed",
    languages: Object.keys(langsRes),
    structure: projectStructure,
  };
}

function buildReadme({ metadata, generated }) {
  const name = metadata.name || metadata.repo || metadata.full_name || "Project";

  const description =
    generated.description ||
    "A production-ready open-source project.";

  const features = (generated.features || []).filter((f) => f);
  const usageExamples = (generated.usage || []).filter((u) => u);

  const languages = metadata.languages?.length
    ? metadata.languages.join(", ")
    : "Not specified";

const structure = metadata.structure?.length
  ? "```\n" + metadata.structure.join("\n") + "\n```"
  : "(structure unavailable)";

  const license = metadata.license || "unlicensed";

  const features_md = features.length
    ? features.map((f) => `- ${f}`).join("\n")
    : "- Clean and modular code\n- Easy to extend\n- Open-source and community-driven";

  const usage_md = usageExamples.length
    ? usageExamples.map((ex) => `\`\`\`bash\n${ex}\n\`\`\``).join("\n\n")
    : "```bash\n# Run the project\nnpm install && npm start\n```";

  return `# ${name}

${description}

## Features
${features_md}

## Installation
\`\`\`bash
git clone ${metadata.repo_url}
cd ${name}
${metadata.languages.includes("JavaScript") ? "npm install" : "# Add installation commands here"}
\`\`\`

## Usage
${usage_md}

## Tech Stack
${languages}

## Project Structure
${structure}

## License
${license}
`;
}

// ---- JSON sanitizer ----
function safeJsonParse(raw) {
  try {
    let text = raw.trim();
    if (text.startsWith("```")) {
      text = text.replace(/```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, "\nRaw output:", raw);
    return {};
  }
}

// ---- main ----
export async function runAgent(repoUrl) {
  let metadata;
  try {
    metadata = await fetchRepoData({ repoUrl });
  } catch (err) {
    return `Error fetching repo: ${err.message}`;
  }

  let prompt;
    prompt = `You are a professional README generator for open-source GitHub repositories. 
Your job is to write a clear, accurate, and detailed project description based ONLY on the provided metadata.

### Rules:
- Always stay factual and consistent with metadata (name, description, repo_url, languages, project structure). 
- Do not invent features or usage steps that are not supported by metadata.
- Description must be 6-7 lines, professional, and concise, explaining the purpose, core functionality, and potential use cases of the project.
- Features must be listed as clear, developer-friendly bullet points.
- Usage instructions must be practical and based on common workflows (npm, yarn, docker, etc. depending on tech stack).
- Do NOT wrap the output in code blocks.
- Output strictly valid JSON in the exact schema.

### Example output:
{
  "description": "This project is a Node.js-based API that provides real-time weather updates. It integrates external APIs to fetch data, caches responses for efficiency, and exposes REST endpoints for client applications. Built with Express and MongoDB, the project ensures scalability and maintainability. Developers can extend it with custom routes or integrate it into larger applications. Ideal for learning API development and rapid prototyping.",
  "features": [
    "REST API endpoints for real-time weather data",
    "Express.js backend with modular routes",
    "MongoDB integration for data persistence",
    "Caching layer for optimized performance",
    "Error handling and validation middleware"
  ],
  "usage": [
    "npm install",
    "npm run dev",
    "Open http://localhost:3000/api/weather"
  ]
}

### Metadata:
${JSON.stringify(metadata, null, 2)}

Generate ONLY JSON in the above schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const generated = safeJsonParse(raw);

  return buildReadme({ metadata, generated });
}


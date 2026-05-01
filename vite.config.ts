/// <reference lib="deno.ns" />

const repoName = Deno.env.get("REPO_NAME");

export default {
    base: repoName ? `/${repoName}/` : "/",
  };

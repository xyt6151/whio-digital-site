# Simple Portfolio Site with Dynamic Blog

A **minimal, modern, and easy-to-deploy** portfolio website with a **dynamic blog** powered by **GitHub Pages** and **Cloudflare Workers**.

---

## Features

- **Clean, responsive design** with Bootstrap
- **Markdown-based blog posts** stored in your repo
- **Automatic article listing** with pagination, search, and filtering
- **No build step** — just push Markdown files
- **Fast, serverless API** via Cloudflare Worker
- **Rate limiting** to protect your API
- **Clean URLs** (no `.html` extensions)
- **Easy to customize**

---

## Getting Started

### 1. **Fork this repository**

- Click **"Fork"** on GitHub to create your own copy.
- Clone it to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

### 2. **Enable GitHub Pages**

- Go to your forked repo's **Settings > Pages**.
- Set **Source** to `main` branch (or `gh-pages` if you prefer).
- Set the folder to `/ (root)` or `/docs` if you move files.
- Save — your site will be live at:  
  `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

### 3. **Add your articles**

- Create Markdown files in the `articles/` directory.
- Each file should start with **YAML front matter**:

```yaml
---
title: My First Post
description: A short summary.
date: 2024-04-06
show: true
---
# Your Markdown content here
```

- Push your changes:

```bash
git add articles/
git commit -m "Add new article"
git push
```

---

### 4. **Set up Cloudflare Worker**

This Worker provides a **JSON API** of your articles and cleans up URLs.

#### a. **Install Wrangler**

Follow the latest instructions here:  
[Cloudflare Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/get-started/)

#### b. **Create a GitHub Personal Access Token**

- Go to **GitHub > Settings > Developer settings > Personal access tokens**.
- Generate a token with **`public_repo`** scope (or `repo` if your repo is private).
- Copy the token.

#### c. **Configure the Worker**

In your project, **change directory** to the Worker folder:

```bash
cd worker
```

Set your GitHub token as a secret:

```bash
wrangler secret put GITHUB_TOKEN
```

Deploy the Worker:

```bash
wrangler deploy
```

This will:

- Set up an API endpoint at `/utils/list-articles`
- Enable clean URLs and redirects
- Enforce rate limiting

---

### 5. **Update your `.gitignore**

Make sure your `.gitignore** excludes**: 
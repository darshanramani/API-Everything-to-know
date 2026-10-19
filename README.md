# Backend APIs & FastAPI, Step by Step

A visual, animated, beginner-friendly guide to **backend APIs** and **FastAPI**.
The website is pure HTML, CSS and JavaScript: no build step, no framework, no API keys.
It also comes with a real, runnable FastAPI app (`example/`) that matches the in-browser playground.

## What's inside

| Part | Steps |
|------|-------|
| 1. How backend APIs work | What a backend API is (restaurant analogy) · Request & response (raw HTTP) · Anatomy of a request (interactive) · Methods & CRUD (interactive) · Status codes · JSON · REST URL design |
| 2. Building APIs with FastAPI | Hello FastAPI · Path & query parameters (interactive) · Pydantic validation (interactive) · Request lifecycle (3 scenarios) · Dependencies with `Depends()` · async & await · Automatic docs (working Swagger UI copy) · Authentication with tokens / JWT |
| 3. Try it yourself | API playground: send real requests to an in-browser Todo API and watch every stage |
| 4. Going further | Run it for real · From tutorial to production · Common mistakes · Glossary · 8-question quiz |

Every animation starts when it scrolls into view and has a **Replay** button.
The page supports dark mode, works on phones, and respects "reduce motion" settings.

## Project structure

```
index.html            page content and layout
css/style.css         all styles (light + dark theme)
js/data.js            all example content, playground presets, glossary and quiz
js/highlight.js       tiny Python / JSON syntax highlighter
js/fakeapi.js         in-browser copy of example/main.py (same rules, same error format)
js/code-data.js       example/main.py as a string, shown in the playground (generated)
js/animations.js      one setup + one animation function per step
js/playground.js      the Step 16 API playground
js/quiz.js            glossary and quiz
js/main.js            scroll progress, navigation, theme toggle, starts animations
example/main.py       the real FastAPI Todo API
example/test_main.py  pytest tests for it
build_code_data.py    regenerates js/code-data.js after you edit example/main.py
```

## Run the website locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Run the real FastAPI example

```bash
cd example
pip install -r requirements.txt
uvicorn main:app --reload
# open http://127.0.0.1:8000/docs
pytest   # run the tests
```

Write endpoints need the header `Authorization: Bearer secret-token`. In `/docs`, click **Authorize** and enter `secret-token`.

If you change `example/main.py`, run `python build_code_data.py` so the playground shows the updated code.
If you change the API's behaviour, update `js/fakeapi.js` to match.

## Publish on GitHub Pages

1. Create a new public repository on GitHub (e.g. `fastapi-step-by-step`).
2. Upload all files from this folder to the repository root (keep the `css/`, `js/` and `example/` folders).
   ```bash
   git init
   git add .
   git commit -m "FastAPI step-by-step site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/fastapi-step-by-step.git
   git push -u origin main
   ```
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick **main** and **/ (root)**, then save.
5. After a minute the site is live at `https://<your-username>.github.io/fastapi-step-by-step/`.
"# API-Everything-to-know" 

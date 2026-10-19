/* ==========================================================
   data.js: the content used by the animations, playground
   and quiz. Edit this file to change examples or questions.
   ========================================================== */

window.APP_DATA = {

  /* Step 1: restaurant analogy */
  restaurant: [
    { at: 0, text: "📝 order", say: "The customer (the frontend: a browser or phone app) decides what they want." },
    { at: 1, text: "📝 order", say: "The waiter (the API) takes the order in a fixed format the kitchen understands." },
    { at: 2, text: "📝 order", say: "The kitchen (the backend) does the real work: checks rules and prepares the dish." },
    { at: 3, text: "🥫 ingredients", say: "The kitchen fetches ingredients from the pantry (the database)." },
    { at: 2, text: "🍝 dish", say: "The dish is ready." },
    { at: 1, text: "🍝 dish", say: "The waiter carries the result back…" },
    { at: 0, text: "🍝 dish", say: "…and the customer gets exactly what they asked for. They never had to enter the kitchen." }
  ],

  /* Step 2: raw HTTP */
  http: {
    request: "GET /todos/1 HTTP/1.1\nHost: api.example.com\nAccept: application/json",
    response: "HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\"title\": \"Learn HTTP basics\", \"done\": true, \"id\": 1}",
    server: ["Find the matching route…", "Run the Python function…", "Read from the database…", "Turn the result into JSON…"]
  },

  /* Step 3: request anatomy */
  anatomy: {
    method:  { label: "Method",  text: "<b>What</b> you want to do. <code>POST</code> means “create something new”. Other methods: GET, PUT, PATCH, DELETE." },
    path:    { label: "Path",    text: "<b>Which resource</b> you're talking about. <code>/users</code> is the collection of users; <code>/users/7</code> would be one user." },
    query:   { label: "Query string", text: "Optional extras after <code>?</code>, written as <code>key=value</code> pairs joined by <code>&amp;</code>. Used for filters, search and paging, e.g. <code>?page=2&amp;limit=20</code>." },
    headers: { label: "Headers", text: "<b>Metadata</b> about the request: which server (<code>Host</code>), what format the body is in (<code>Content-Type</code>), and who is calling (<code>Authorization</code>)." },
    body:    { label: "Body",    text: "The <b>data being sent</b>, usually JSON. POST, PUT and PATCH have a body; GET and DELETE normally don't." }
  },

  /* Step 4: CRUD table seed */
  crudSeed: [
    { id: 1, title: "Learn HTTP basics", done: true },
    { id: 2, title: "Build my first API", done: false },
    { id: 3, title: "Deploy it", done: false }
  ],

  /* Step 5: status codes */
  statusCodes: [
    [200, "OK", "It worked. Here's the data you asked for."],
    [201, "Created", "A new resource was created (typical answer to POST)."],
    [204, "No Content", "It worked, and there's nothing to send back (typical answer to DELETE)."],
    [301, "Moved Permanently", "This resource lives at a new URL now."],
    [304, "Not Modified", "Nothing changed since last time; use your cached copy."],
    [307, "Temporary Redirect", "Ask again at a slightly different URL (FastAPI sends this for a stray trailing slash)."],
    [400, "Bad Request", "The request is malformed and the server can't understand it."],
    [401, "Unauthorized", "You haven't proven who you are: no token, or an invalid one."],
    [403, "Forbidden", "We know who you are, but you're not allowed to do this."],
    [404, "Not Found", "There's nothing at this URL, or that item doesn't exist."],
    [405, "Method Not Allowed", "The URL exists, but not for this method (e.g. PUT on a read-only URL)."],
    [422, "Unprocessable Content", "The data failed validation. FastAPI uses this for bad input."],
    [429, "Too Many Requests", "Slow down: you've hit a rate limit."],
    [500, "Internal Server Error", "The server's code crashed. This is a bug on the server side."],
    [503, "Service Unavailable", "The server is down or overloaded right now."]
  ],

  /* Step 6: Python ↔ JSON */
  jsonRows: [
    ['{<span class="t-str">"id"</span>: <span class="t-num">1</span>,', '{<span class="t-key">"id"</span>: <span class="t-num">1</span>,', "Numbers stay numbers"],
    ['<span class="t-str">"title"</span>: <mark>\'</mark><span class="t-str">Learn FastAPI</span><mark>\'</mark>,', '<span class="t-key">"title"</span>: <mark>"</mark><span class="t-str">Learn FastAPI</span><mark>"</mark>,', "JSON strings always use double quotes"],
    ['<span class="t-str">"done"</span>: <mark>False</mark>,', '<span class="t-key">"done"</span>: <mark>false</mark>,', "False → false"],
    ['<span class="t-str">"tags"</span>: <mark>(</mark><span class="t-str">"api"</span>, <span class="t-str">"python"</span><mark>)</mark>,', '<span class="t-key">"tags"</span>: <mark>[</mark><span class="t-str">"api"</span>, <span class="t-str">"python"</span><mark>]</mark>,', "Lists and tuples become arrays"],
    ['<span class="t-str">"due"</span>: <mark>None</mark>}', '<span class="t-key">"due"</span>: <mark>null</mark>}', "None → null"]
  ],

  /* Step 7: REST URL design */
  restRows: [
    ["/getAllTodos", "GET", "/todos"],
    ["/getTodo?id=5", "GET", "/todos/5"],
    ["/createNewTodo", "POST", "/todos"],
    ["/updateTodo?id=5", "PATCH", "/todos/5"],
    ["/removeTodo?id=5", "DELETE", "/todos/5"],
    ["/getTodosForUser?user=7", "GET", "/users/7/todos"],
    ["/getDoneTodos", "GET", "/todos?done=true"]
  ],

  /* Step 9: path & query parameter presets */
  paramPresets: ["/items/42?q=phone&limit=5", "/items/7", "/items/abc", "/products/1"],

  /* Step 10: Pydantic presets */
  pydanticPresets: {
    "Valid": '{\n  "name": "Asha",\n  "email": "asha@example.com",\n  "age": 24\n}',
    "Missing email": '{\n  "name": "Asha",\n  "age": 24\n}',
    "Wrong types": '{\n  "name": 123,\n  "email": "asha-at-example.com",\n  "age": "twenty"\n}',
    "Too young": '{\n  "name": "Asha",\n  "email": "asha@example.com",\n  "age": 9\n}',
    "\"24\" as text": '{\n  "name": "Asha",\n  "email": "asha@example.com",\n  "age": "24"\n}'
  },

  /* Step 11: request lifecycle */
  lifecycle: {
    nodes: [
      { id: "client", icon: "💻", label: "Client",       say: "The client sends: POST /todos, with a token and a JSON body." },
      { id: "server", icon: "🦄", label: "Uvicorn",      say: "Uvicorn, the ASGI server, receives the raw HTTP bytes and hands them to FastAPI." },
      { id: "mw",     icon: "🧅", label: "Middleware",   say: "Middleware runs on every request: logging, CORS headers, timing…" },
      { id: "router", icon: "🧭", label: "Router",       say: "The router matches method + path to your function: create_todo()." },
      { id: "deps",   icon: "🔌", label: "Dependencies", say: "Dependencies run first. Here require_token() checks the Authorization header." },
      { id: "valid",  icon: "🛡️", label: "Validation",   say: "Pydantic checks the path, query and body against your type hints." },
      { id: "fn",     icon: "🐍", label: "Your code",    say: "Only now does YOUR function run, with clean, typed data." },
      { id: "resp",   icon: "📦", label: "Response",     say: "The return value is filtered by response_model and turned into JSON." }
    ],
    scenarios: {
      ok:      { stop: null,    status: "201 Created",           body: '{"title": "Write tests", "done": false, "id": 4}', end: "Success! 201 Created travels back through the middleware to the client." },
      invalid: { stop: "valid", status: "422 Unprocessable",    body: '{"detail": [{"type": "missing", "loc": ["body", "title"], …}]}', end: "The body had no title, so Pydantic rejected it. Your function never ran, and FastAPI sent a 422 automatically." },
      notoken: { stop: "deps",  status: "401 Unauthorized",     body: '{"detail": "Not authenticated"}', end: "No token, so the dependency raised HTTPException(401). Validation and your function were skipped." }
    }
  },

  /* Step 13: async timeline (seconds) */
  asyncReqs: [
    { name: "Request 1", start: 0.0 },
    { name: "Request 2", start: 0.1 },
    { name: "Request 3", start: 0.2 }
  ],
  asyncShape: { cpu: 0.2, io: 1.0 },

  /* Step 15: auth sequence */
  authSeq: [
    { dir: "right", label: "POST /token", sub: "username=asha & password=••••••" },
    { dir: "server", label: "Check the password hash ✓", sub: "then create a signed token" },
    { dir: "left", label: "200 OK", sub: '{"access_token": "eyJhbGci…", "token_type": "bearer"}', ok: true },
    { dir: "client", label: "Save the token", sub: "e.g. in memory or secure storage" },
    { dir: "right", label: "GET /users/me", sub: "Authorization: Bearer eyJhbGci…" },
    { dir: "server", label: "Verify signature & expiry ✓", sub: "read the username from the token" },
    { dir: "left", label: "200 OK", sub: '{"username": "asha"}', ok: true },
    { dir: "right", label: "GET /users/me", sub: "(no Authorization header)" },
    { dir: "left", label: "401 Unauthorized", sub: '{"detail": "Not authenticated"}', bad: true }
  ],

  /* Step 16: playground presets */
  presets: [
    { label: "List todos",            method: "GET",    url: "/todos" },
    { label: "Only finished",         method: "GET",    url: "/todos?done=true" },
    { label: "Get #1",                method: "GET",    url: "/todos/1" },
    { label: "Get #99 (404)",         method: "GET",    url: "/todos/99" },
    { label: "Bad id (422)",          method: "GET",    url: "/todos/abc" },
    { label: "Create, no token (401)", method: "POST",  url: "/todos", body: '{\n  "title": "Write tests"\n}', auth: false },
    { label: "Create todo (201)",     method: "POST",   url: "/todos", body: '{\n  "title": "Write tests"\n}', auth: true },
    { label: "Empty title (422)",     method: "POST",   url: "/todos", body: '{\n  "title": "",\n  "done": "maybe"\n}', auth: true },
    { label: "Mark #2 done",          method: "PATCH",  url: "/todos/2", body: '{\n  "done": true\n}', auth: true },
    { label: "Delete #3 (204)",       method: "DELETE", url: "/todos/3", auth: true },
    { label: "Wrong method (405)",    method: "PUT",    url: "/todos", body: '{\n  "title": "x"\n}', auth: true },
    { label: "Unknown URL (404)",     method: "GET",    url: "/users" },
    { label: "Health check",          method: "GET",    url: "/health" }
  ],

  glossary: [
    ["API", "Application Programming Interface: a defined way for one program to ask another for data or actions."],
    ["Backend", "The server side of an app: business logic, data storage, security. Users never see it directly."],
    ["Endpoint", "One URL + method combination the API responds to, e.g. GET /todos."],
    ["HTTP", "The protocol browsers and apps use to send requests and receive responses."],
    ["Method (verb)", "What the request wants to do: GET, POST, PUT, PATCH, DELETE."],
    ["Status code", "A 3-digit number in every response that says how it went (200, 404, 500…)."],
    ["Header", "A key–value line of metadata sent with a request or response."],
    ["JSON", "JavaScript Object Notation: the text format most APIs use to send data."],
    ["REST", "A style of API design built around resources (nouns) and HTTP methods (verbs)."],
    ["CRUD", "Create, Read, Update, Delete: the four basic data operations."],
    ["Path parameter", "A variable inside the URL path, like 42 in /items/42."],
    ["Query parameter", "An optional key=value after ? in the URL, like ?limit=5."],
    ["Pydantic", "The library FastAPI uses to validate data using Python type hints."],
    ["Validation", "Checking incoming data has the right shape and types before using it."],
    ["Dependency injection", "FastAPI's Depends(): declare what a function needs and FastAPI provides it."],
    ["ASGI / Uvicorn", "ASGI is the async Python server standard; Uvicorn is a server that runs FastAPI apps."],
    ["async / await", "Python syntax that lets a server work on other requests while one is waiting."],
    ["JWT", "JSON Web Token: a signed token that proves who the caller is."],
    ["OpenAPI", "A standard description of an API. FastAPI generates it and builds /docs from it."],
    ["Middleware", "Code that runs on every request and response, e.g. logging or CORS."]
  ],

  quiz: [
    { q: "In the restaurant analogy, what plays the role of the API?",
      options: ["The customer", "The waiter", "The kitchen", "The pantry"], answer: 1,
      why: "The API is the waiter: a fixed interface that carries requests to the backend and results back." },
    { q: "Which HTTP method should you use to create a new resource?",
      options: ["GET", "POST", "DELETE", "HEAD"], answer: 1,
      why: "POST creates. GET reads, PUT/PATCH update, DELETE removes." },
    { q: "A user asks for /todos/99, but todo 99 doesn't exist. Which status code fits?",
      options: ["200", "201", "404", "500"], answer: 2,
      why: "404 Not Found: the request was fine, but the thing doesn't exist. 500 would mean the server crashed." },
    { q: "Which URL follows REST conventions best?",
      options: ["/getTodo?id=5", "/todos/5", "/todo_get/5", "/api/fetchTodoById/5"], answer: 1,
      why: "Use nouns in the path and let the HTTP method say the action: GET /todos/5." },
    { q: "In @app.get(\"/items/{item_id}\"), what is item_id?",
      options: ["A query parameter", "A header", "A path parameter", "A request body"], answer: 2,
      why: "Anything in {curly braces} in the route path is a path parameter." },
    { q: "A request body is missing a required field. What does FastAPI do?",
      options: ["Runs your function with None", "Returns 422 with details, without running your function", "Crashes with 500", "Returns 200 anyway"], answer: 1,
      why: "Pydantic validation fails first, and FastAPI answers 422 automatically with a list of what's wrong." },
    { q: "What is Depends() used for?",
      options: ["Installing packages", "Declaring things a route needs (DB session, current user) so FastAPI provides them", "Making a function async", "Importing other files"], answer: 1,
      why: "Dependency injection: you declare the need, and FastAPI runs the dependency and passes in the result." },
    { q: "Inside an async def endpoint, which call is a problem?",
      options: ["await asyncio.sleep(1)", "await client.get(url) with httpx", "time.sleep(1)", "return {\"ok\": True}"], answer: 2,
      why: "time.sleep() blocks the whole event loop, so every other request waits too. Use await-able calls instead." }
  ]
};

"""A tiny Todo API: the real FastAPI version of the website's playground.

Run it:
    pip install -r requirements.txt
    uvicorn main:app --reload
Then open http://127.0.0.1:8000/docs
"""

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

app = FastAPI(title="Todo API", version="1.0.0")


# ---------- Data models (Pydantic) ----------

class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    done: bool = False


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    done: bool | None = None


class Todo(TodoCreate):
    id: int


# ---------- "Database" (in memory, resets on restart) ----------

todos: dict[int, Todo] = {
    1: Todo(id=1, title="Learn HTTP basics", done=True),
    2: Todo(id=2, title="Build my first API", done=False),
    3: Todo(id=3, title="Deploy it", done=False),
}
next_id = 4


# ---------- Auth dependency ----------

API_TOKEN = "secret-token"  # demo only: use real auth (OAuth2/JWT) in production
bearer = HTTPBearer(auto_error=False)


def require_token(creds: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if creds is None or creds.credentials != API_TOKEN:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


# ---------- Routes ----------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/todos", response_model=list[Todo])
def list_todos(done: bool | None = None, limit: int = Query(default=10, ge=1, le=100)):
    items = [t for t in todos.values() if done is None or t.done == done]
    return items[:limit]


@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todos[todo_id]


@app.post("/todos", response_model=Todo, status_code=201, dependencies=[Depends(require_token)])
def create_todo(data: TodoCreate):
    global next_id
    todo = Todo(id=next_id, **data.model_dump())
    todos[next_id] = todo
    next_id += 1
    return todo


@app.put("/todos/{todo_id}", response_model=Todo, dependencies=[Depends(require_token)])
def replace_todo(todo_id: int, data: TodoCreate):
    if todo_id not in todos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Todo not found")
    todos[todo_id] = Todo(id=todo_id, **data.model_dump())
    return todos[todo_id]


@app.patch("/todos/{todo_id}", response_model=Todo, dependencies=[Depends(require_token)])
def update_todo(todo_id: int, data: TodoUpdate):
    if todo_id not in todos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Todo not found")
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    todos[todo_id] = todos[todo_id].model_copy(update=changes)
    return todos[todo_id]


@app.delete("/todos/{todo_id}", status_code=204, dependencies=[Depends(require_token)])
def delete_todo(todo_id: int):
    if todo_id not in todos:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Todo not found")
    del todos[todo_id]

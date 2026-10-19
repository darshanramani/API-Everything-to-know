"""Run with:  pytest"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer secret-token"}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_todos():
    r = client.get("/todos")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_missing_todo_returns_404():
    r = client.get("/todos/9999")
    assert r.status_code == 404
    assert r.json() == {"detail": "Todo not found"}


def test_create_requires_token():
    r = client.post("/todos", json={"title": "No token"})
    assert r.status_code == 401


def test_create_validates_body():
    r = client.post("/todos", json={"title": ""}, headers=AUTH)
    assert r.status_code == 422


def test_create_and_delete():
    r = client.post("/todos", json={"title": "Write tests"}, headers=AUTH)
    assert r.status_code == 201
    todo_id = r.json()["id"]
    assert client.delete(f"/todos/{todo_id}", headers=AUTH).status_code == 204
    assert client.get(f"/todos/{todo_id}").status_code == 404

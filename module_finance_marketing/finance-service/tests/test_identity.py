"""Résolution X-User-Email → id_student via academic-service (sans réseau)."""
import io
import json
import urllib.error

from app import identity


class _Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_resolve_student_id_uses_email_headers(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["headers"] = {k.lower(): v for k, v in request.header_items()}
        return _Response(json.dumps({"student": {"student_id": 42}}).encode())

    monkeypatch.setattr(identity.urllib.request, "urlopen", fake_urlopen)
    assert identity.resolve_student_id("awa@campus.edu", 13) == 42
    assert captured["url"].endswith("/student/me/overview")
    assert captured["headers"]["x-user-email"] == "awa@campus.edu"
    assert captured["headers"]["x-user-role"] == "student"


def test_resolve_student_id_returns_none_when_unknown(monkeypatch):
    def failing_urlopen(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 403, "Forbidden", {}, None)

    monkeypatch.setattr(identity.urllib.request, "urlopen", failing_urlopen)
    assert identity.resolve_student_id("inconnu@campus.edu", 99) is None
    assert identity.resolve_student_id(None, 99) is None

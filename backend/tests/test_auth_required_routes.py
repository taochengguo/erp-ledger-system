from fastapi.routing import APIRoute

from app.auth import get_current_user
from app.main import app


def _route(path: str) -> APIRoute:
    for route in app.routes:
        if isinstance(route, APIRoute) and route.path == path:
            return route
    raise AssertionError(f"Route not found: {path}")


def _requires_login(path: str) -> bool:
    route = _route(path)
    return any(dependency.call is get_current_user for dependency in route.dependant.dependencies)


def test_business_api_requires_login_dependency():
    protected_paths = [
        "/api/dashboard/summary",
        "/api/ledgers",
        "/api/orders",
        "/api/purchases",
        "/api/sales",
        "/api/logs",
        "/api/backups",
    ]

    for path in protected_paths:
        assert _requires_login(path), path


def test_health_remains_public():
    assert not _requires_login("/api/health")

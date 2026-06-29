from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text

from .config import settings
from .db import db

Permission = str

ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    "admin": {"order_entry", "purchase_entry", "sales_entry", "system_admin"},
    "order_entry": {"order_entry"},
    "purchase_entry": {"purchase_entry"},
    "sales_entry": {"sales_entry"},
    "viewer": set(),
}

ROLE_LABELS: dict[str, str] = {
    "admin": "管理员",
    "order_entry": "订单录入员",
    "purchase_entry": "采购录入员",
    "sales_entry": "销售录入员",
    "viewer": "查看员",
}

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: int
    username: str
    display_name: str
    role_code: str
    permissions: list[str]


def has_permission(role_code: str, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role_code, set())


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return f"pbkdf2_sha256$120000${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(user: CurrentUser, expires_in_seconds: int = 12 * 60 * 60) -> str:
    payload = {
        "sub": user.username,
        "role": user.role_code,
        "exp": int(time.time()) + expires_in_seconds,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_b64 = _b64encode(payload_bytes)
    signature = _sign(payload_b64.encode("ascii"))
    return f"{payload_b64}.{signature}"


def decode_access_token(token: str) -> dict:
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not hmac.compare_digest(_sign(payload_b64.encode("ascii")), signature):
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        payload = json.loads(_b64decode(payload_b64))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")
    return payload


def ensure_default_admin() -> None:
    with db() as conn:
        exists = conn.execute(text("SELECT 1 FROM erp_user WHERE username = 'admin'")).scalar()
        if exists:
            return
        conn.execute(
            text(
                """
                INSERT INTO erp_user (username, password_hash, display_name, role_code, is_active)
                VALUES (:username, :password_hash, :display_name, :role_code, 1)
                """
            ),
            {
                "username": "admin",
                "password_hash": hash_password(os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")),
                "display_name": "系统管理员",
                "role_code": "admin",
            },
        )


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    with db() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, username, display_name, role_code
                FROM erp_user
                WHERE username = :username AND is_active = 1
                """
            ),
            {"username": username},
        ).mappings().first()
    if row is None:
        raise HTTPException(status_code=401, detail="User disabled or not found")
    role_code = str(row["role_code"])
    return CurrentUser(
        id=int(row["id"]),
        username=str(row["username"]),
        display_name=str(row["display_name"]),
        role_code=role_code,
        permissions=sorted(ROLE_PERMISSIONS.get(role_code, set())),
    )


def require_permission(permission: Permission) -> Callable[[CurrentUser], CurrentUser]:
    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not has_permission(user.role_code, permission):
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return dependency


def current_user_payload(user: CurrentUser) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "role_code": user.role_code,
        "role_label": ROLE_LABELS.get(user.role_code, user.role_code),
        "permissions": user.permissions,
    }


def _sign(value: bytes) -> str:
    signature = hmac.new(settings.auth_secret.encode("utf-8"), value, hashlib.sha256).digest()
    return _b64encode(signature)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)

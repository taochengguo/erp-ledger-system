from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from ..auth import (
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    CurrentUser,
    create_access_token,
    current_user_payload,
    get_current_user,
    hash_password,
    require_permission,
    verify_password,
)
from ..db import db
from ..serializers import clean_rows

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=64)
    role_code: str


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    with db() as conn:
        row = conn.execute(
            text(
                """
                SELECT id, username, password_hash, display_name, role_code, is_active
                FROM erp_user
                WHERE username = :username
                """
            ),
            {"username": payload.username},
        ).mappings().first()
        if row is None or not row["is_active"] or not verify_password(payload.password, str(row["password_hash"])):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        user = CurrentUser(
            id=int(row["id"]),
            username=str(row["username"]),
            display_name=str(row["display_name"]),
            role_code=str(row["role_code"]),
            permissions=sorted(ROLE_PERMISSIONS.get(str(row["role_code"]), set())),
        )
        conn.execute(text("UPDATE erp_user SET last_login_at = NOW() WHERE id = :id"), {"id": user.id})
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": current_user_payload(user)}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"user": current_user_payload(user)}


@router.get("/roles")
def roles(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {
        "items": [
            {
                "role_code": role_code,
                "role_label": ROLE_LABELS[role_code],
                "permissions": sorted(permissions),
            }
            for role_code, permissions in ROLE_PERMISSIONS.items()
        ]
    }


@router.get("/users")
def list_users(_: CurrentUser = Depends(require_permission("system_admin"))) -> dict:
    with db() as conn:
        rows = conn.execute(
            text(
                """
                SELECT id, username, display_name, role_code, is_active, last_login_at, created_at
                FROM erp_user
                ORDER BY id
                """
            )
        ).mappings().all()
    return {"items": clean_rows(rows)}


@router.post("/users")
def create_user(payload: UserCreate, admin: CurrentUser = Depends(require_permission("system_admin"))) -> dict:
    if payload.role_code not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=400, detail="无效的角色")
    with db() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM erp_user WHERE username = :username"),
            {"username": payload.username},
        ).scalar()
        if exists:
            raise HTTPException(status_code=409, detail="账号已存在")
        conn.execute(
            text(
                """
                INSERT INTO erp_user (username, password_hash, display_name, role_code, is_active)
                VALUES (:username, :password_hash, :display_name, :role_code, 1)
                """
            ),
            {
                "username": payload.username,
                "password_hash": hash_password(payload.password),
                "display_name": payload.display_name,
                "role_code": payload.role_code,
            },
        )
        conn.execute(
            text(
                """
                INSERT INTO operation_log (user_id, user_name, module_name, action_name, detail, status)
                VALUES (:user_id, :user_name, '账号管理', 'create_user', :detail, 'success')
                """
            ),
            {"user_id": admin.id, "user_name": admin.display_name, "detail": f"创建账号 {payload.username}"},
        )
    return list_users(admin)

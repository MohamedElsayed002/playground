from types import SimpleNamespace 
from unittest.mock import AsyncMock

import pytest 

from app.exceptions.handlers import BadRequestException, NotFoundException
from app.schemas.user import PasswordChange, UserUpdate 
from app.services import user_service

@pytest.mark.asyncio
async def test_get_user_by_id_returns_user():
    user = SimpleNamespace(id=7)
    db = SimpleNamespace(
        execute=AsyncMock(
            return_value=SimpleNamespace(scalar_one_or_none=lambda:user)
        )
    )

    result = await user_service.get_user_by_id(db,id)
    assert result is user 
    db.execute.assert_awaited_once()


@pytest.mark.asyncio 
async def test_get_user_by_id_raises_when_missing():
    db = SimpleNamespace(
        execute=AsyncMock(
            return_value=SimpleNamespace(scalar_one_or_none=lambda: None)
        )
    )

    with pytest.raises(NotFoundException):
        await user_service.get_user_by_id(db,404)


@pytest.mark.asyncio
async def test_list_users_returns_page_and_total():
    users = [SimpleNamespace(id=1), SimpleNamespace(id=2)]
    count_result = SimpleNamespace(scalar=lambda: 5)

    rows_result = SimpleNamespace(
        scalars=lambda: SimpleNamespace(all=lambda: users)
    )

    db = SimpleNamespace(
        execute=AsyncMock(
            side_effect=[count_result, rows_result]
        )
    )

    result = await user_service.list_users(db,page=2,page_size=2)

    assert result == {
        "items": users,
        "total": 5,
        "page": 2,
        "page_size": 2,
        "pages": 3
    }

    assert db.execute.await_count == 2


@pytest.mark.asyncio
async def test_update_user_profile_changes_only_supplied_fields(monkeypatch):
    user = SimpleNamespace(id=1, name="Old Name", last_name="Keep")
    db = SimpleNamespace(flush=AsyncMock(), refresh=AsyncMock())
    audit = AsyncMock()

    monkeypatch.setattr(user_service,"create_audit_log",audit)

    result = await user_service.update_user_profile(
        db, user, UserUpdate(first_name="New Name")
    )

    assert result is user 
    assert user.first_name == "New Name"
    assert user.last_name == "Keep"

    db.flush.assert_awaited_once()
    db.refresh.assert_awaited_once_with(user)

    audit.assert_awaited_once()
    assert audit.await_args.kwargs["metadata"] == {
        "changed_fields": ["first_name"]
    }


@pytest.mark.asyncio
async def test_update_user_profile_does_not_audit_empty_patch(monkeypatch):
    user = SimpleNamespace(id=1)
    db = SimpleNamespace(
        flush=AsyncMock(), refresh=AsyncMock()
    )

    audit = AsyncMock()
    monkeypatch.setattr(user_service,"create_audit_log",audit)

    await user_service.update_user_profile(db,user,UserUpdate())

    audit.assert_not_awaited()


@pytest.mark.asyncio
async def test_change_password_rejects_wrong_current_password(monkeypatch):
    user = SimpleNamespace(id=12, hashed_password="stored-hash")
    db = SimpleNamespace(flush=AsyncMock())
    audit = AsyncMock()

    monkeypatch.setattr(user_service,"verify_password",lambda *_ : False)
    monkeypatch.setattr(user_service, "create_audit_log", audit)

    with pytest.raises(BadRequestException, match='Current password is incorrect'):
        await user_service.change_password(
            db, user, PasswordChange(current_password='wrong',new_password='new-password')
        )

    db.flush.assert_not_awaited()
    audit.assert_awaited_once()
    assert audit.await_args.kwargs["metadata"] == {
        "reason": "incorrect_current_password"
    }


@pytest.mark.asyncio 
async def test_change_password_hashed_new_password(monkeypatch):
    user = SimpleNamespace(id=12, hashed_password="old-hash")
    db = SimpleNamespace(flush=AsyncMock())
    audit = AsyncMock()

    monkeypatch.setattr(user_service, "verify_password", lambda *_ : True)
    monkeypatch.setattr(user_service, "hash_password", lambda password: f"hash:{password}")
    monkeypatch.setattr(user_service, "create_audit_log", audit)

    await user_service.change_password(
        db, user, PasswordChange(current_password='old', new_password='new-password')
    )

    assert user.hashed_password == "hash:new-password"
    db.flush.assert_awaited_once()
    audit.assert_awaited_once()
    assert audit.await_args.kwargs["event"] == "USER_PASSWORD_CHANGED"


@pytest.mark.asyncio
async def test_update_avatar_persists_url_and_audits(monkeypatch):
    user = SimpleNamespace(id=13, avatar_url=None)

    db=SimpleNamespace(flush=AsyncMock(), refresh=AsyncMock())
    audit = AsyncMock()
    monkeypatch.setattr(user_service, "create_audit_log", audit)

    result = await user_service.update_avatar(db,user,"https://example.test/avatar.png")

    assert result is user

    assert user.avatar_url == "https://example.test/avatar.png"
    db.flush.assert_awaited_once()
    db.refresh.assert_awaited_once_with(user)
    assert audit.await_args.kwargs["event"] == "USER_AVATAR_UPDATED"

@pytest.mark.asyncio
async def test_deactivate_user_marks_account_inactive(monkeypatch):
    user = SimpleNamespace(id=21, email="mosayed@gmail.com",is_active=True)

    db = SimpleNamespace(flush=AsyncMock())
    audit = AsyncMock()
    monkeypatch.setattr(user_service,"get_user_by_id",AsyncMock(return_value=user))
    monkeypatch.setattr(user_service,"create_audit_log",audit)

    await user_service.deactivate_user(db,user_id=21,actor_user_id=3)

    assert user.is_active is False
    db.flush.assert_awaited_once()
    assert audit.await_args.kwargs["user_id"] == 3
    assert audit.await_args.kwargs["metadata"] == {
        "target_user_id": 21,
        "target_email": "mosayed@gmail.com"
    }

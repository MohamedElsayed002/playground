from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock 

import pytest
from jose import JWTError

from app.exceptions.handlers import BadRequestException, ConflictException, NotFoundException
from app.models.user import UserRole
from app.schemas.user import TokenResponse, UserCreate
from app.services import auth_service

def result(value):
    return SimpleNamespace(scalar_one_or_none=lambda: value)

def mock_db(*results):
    return SimpleNamespace(
        execute=AsyncMock(side_effect=results),
        add=Mock(),
        flush=AsyncMock(),
        refresh=AsyncMock()
    )

def create_data():
    return UserCreate(
        email="person@example.com",
        username="Test_User",
        password="StrongPass1",
        first_name="Test",
        last_name="Person",
        phone="123",
    )


@pytest.mark.asyncio
async def test_register_user_rejects_duplicate_email(monkeypatch):
    audit = AsyncMock()
    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    db = mock_db(result(SimpleNamespace()))

    with pytest.raises(ConflictException, match="email already exists"):
        await auth_service.register_user(db, create_data())

    assert db.execute.await_count == 1
    audit.assert_awaited_once()
    assert audit.await_args.kwargs["metadata"]["reason"] == "email_exists"


@pytest.mark.asyncio 
async def test_register_user_rejects_duplicate_username(monkeypatch):
    audit = AsyncMock()
    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    db = mock_db(result(None), result(SimpleNamespace()))

    with pytest.raises(ConflictException, match="username is already taken"):
        await auth_service.register_user(db, create_data())

    assert db.execute.await_count == 2
    assert audit.await_args.kwargs["metadata"]["reason"] == "username_exists"

@pytest.mark.asyncio 
async def test_register_user_creates_user_and_emits_audits(monkeypatch):
    audit = AsyncMock()
    workos = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "create_workos_audit_event_async", workos)
    monkeypatch.setattr(auth_service, "hash_password",lambda password: f"hashed:{password}")

    db = mock_db(result(None), result(None))

    user = await auth_service.register_user(db, create_data())
    assert user.email == "person@example.com"
    assert user.username == "test_user"
    assert user.hashed_password == "hashed:StrongPass1"
    assert user.first_name == "Test"

    db.add.assert_called_once_with(user)
    db.flush.assert_awaited_once()
    db.refresh.assert_awaited_once_with(user)

    assert audit.await_args.kwargs["event"] == "AUTH_REGISTER_SUCCESS"

    workos.assert_awaited_once()


@pytest.mark.asyncio
@pytest.mark.parametrize("found_user", [None, SimpleNamespace(hashed_password="hash")])
async def test_login_user_rejects_invalid_credentials(monkeypatch,found_user):
    audit = AsyncMock()
    workos = AsyncMock()

    monkeypatch.setattr(auth_service,"create_audit_log", audit)
    monkeypatch.setattr(auth_service,"create_workos_audit_event_async", workos)
    monkeypatch.setattr(auth_service, "verify_password", lambda *_: False)

    db = mock_db(result(found_user))

    with pytest.raises(BadRequestException, match="Invalid email or password"):
        await auth_service.login_user(db,"person@example.com","wrong")

    assert audit.await_args.kwargs["metadata"]["reason"] == "invalid_credentials"


@pytest.mark.asyncio
async def test_login_user_rejects_inactive_account(monkeypatch):
    user = SimpleNamespace(
        id=2,
        email="person@example.com",
        hashed_password="hash",
        is_active=False
    )

    audit = AsyncMock()
    workos = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "create_workos_audit_event_async", workos)
    monkeypatch.setattr(auth_service, "verify_password", lambda *_ : True)

    db = mock_db(result(user))

    with pytest.raises(BadRequestException, match="Account is deactivated"):
        await auth_service.login_user(db, user.email, "pw")

    audit.assert_awaited_once()
    workos.assert_not_awaited()


@pytest.mark.asyncio
async def test_login_user_returns_tokens_and_ignores_workos_failure(monkeypatch):

    user = SimpleNamespace(
        id=5,
        email="person@example.com",
        hashed_password="hash",
        is_active=True,
        role=UserRole.ADMIN
    )

    audit = AsyncMock()
    workos = AsyncMock(side_effect=RuntimeError("audit service down"))

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "create_workos_audit_event_async", workos)
    monkeypatch.setattr(auth_service, "verify_password", lambda *_: True)
    monkeypatch.setattr(auth_service, "create_access_token", lambda **kw: "access")
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda **kw: "refresh")

    db = mock_db(result(user))

    tokens = await auth_service.login_user(db,user.email,'pw')

    assert tokens == TokenResponse(access_token="access", refresh_token="refresh")

    audit.assert_awaited_once()
    workos.assert_awaited_once()
    
@pytest.mark.asyncio
async def test_refresh_access_token_rejects_wrong_token_type(monkeypatch):
    audit = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "decode_token",lambda _: {"type": "access"})

    db = mock_db()

    with pytest.raises(BadRequestException, match="Invalid token type"):
        await auth_service.refresh_access_token(db,"token")

    db.execute.assert_not_awaited()
    assert audit.await_args.kwargs["metadata"]["reason"] == "invalid_token_type"

@pytest.mark.asyncio
async def test_refresh_access_token_rejects_wrong_token_type(monkeypatch):
    audit = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "decode_token", lambda _: {"type": "access"})

    db = mock_db()

    with pytest.raises(BadRequestException, match="Invalid token type"):
        await auth_service.refresh_access_token(db,"token")

    db.execute.assert_not_awaited()
    assert audit.await_args.kwargs["metadata"]["reason"] == "invalid_token_type"

@pytest.mark.asyncio
@pytest.mark.parametrize("payload", [None, {"type": "refresh"}, {"type": "refresh", "sub": "bad"}])
async def test_refresh_access_token_rejects_invalid_or_malformed_tokens(monkeypatch, payload):

    audit = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)

    if payload is None:
        monkeypatch.setattr(auth_service, "decode_token", lambda _: (_ for _ in ()).throw(JWTError("bad token")))
    else:
        monkeypatch.setattr(auth_service, "decode_token", lambda _: payload)

    db = mock_db()

    with pytest.raises(BadRequestException, match="Invalid or expired refresh token"):
        await auth_service.refresh_access_token(db,"token")

    db.execute.assert_not_awaited()
    assert audit.await_args.kwargs["metadata"]["reason"] == "invalid_or_expired_refresh_token"

@pytest.mark.asyncio 
@pytest.mark.parametrize("user", [None, SimpleNamespace(id=8, is_active=False)])
async def test_refresh_access_token_rejects_missing_or_inactive_user(monkeypatch,user):
    audit = AsyncMock()

    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "decode_token", lambda _: {"type": "refresh", "sub": "8"})

    db = mock_db(result(user))

    with pytest.raises(NotFoundException, match="User not found"):
        await auth_service.refresh_access_token(db,"token")

    assert audit.await_args.kwargs["metadata"]["reason"] == "user_not_found_or_inactive"

@pytest.mark.asyncio
async def test_refresh_access_token_returns_rotated_tokens(monkeypatch):
    user = SimpleNamespace(id=8, is_active=True, role=UserRole.USER)
    audit = AsyncMock()
    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "decode_token", lambda _: {"type": "refresh", "sub": "8"})
    monkeypatch.setattr(auth_service, "create_access_token", lambda *args, **kwargs: "new-access")
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda *args, **kwargs: "new-refresh")
    db = mock_db(result(user))

    tokens = await auth_service.refresh_access_token(db, "old-refresh")

    assert tokens == TokenResponse(access_token="new-access", refresh_token="new-refresh")
    assert audit.await_args.kwargs["event"] == "AUTH_REFRESH_SUCCESS"


@pytest.mark.asyncio
async def test_logout_user_audits_and_returns_message_even_if_workos_fails(monkeypatch):
    user = SimpleNamespace(id=9, email="person@example.com")
    audit = AsyncMock()
    workos = AsyncMock(side_effect=RuntimeError("audit service down"))
    monkeypatch.setattr(auth_service, "create_audit_log", audit)
    monkeypatch.setattr(auth_service, "create_workos_audit_event_async", workos)

    result_value = await auth_service.logout_user(mock_db(), user)

    assert result_value == {"message": "Logged out successfully"}
    audit.assert_awaited_once()
    workos.assert_awaited_once()

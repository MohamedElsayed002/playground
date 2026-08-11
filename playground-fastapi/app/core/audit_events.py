from enum import Enum
from typing import Literal


class AuditEvent(str, Enum):
    USER_LOGGED_IN = "user.loggedIn"
    USER_LOGIN_FAILED = "user.loginFailed"
    USER_UPDATED = "user.updated"
    USER_REGISTERED = "user.registered"
    USER_REFRESH_TOKEN = "user.refreshToken"
    USER_DEACTIVATED = "user.deactivated"


AuditEventType = Literal[
    "user.loggedIn",
    "user.loginFailed",
    "user.updated",
    "user.registered",
    "user.refreshToken",
    "user.deactivated",
]

ALL_AUDIT_EVENTS: list[AuditEventType] = [event.value for event in AuditEvent]

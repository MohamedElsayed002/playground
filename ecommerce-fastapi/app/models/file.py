from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Enum as SQLEnum
from app.db.base import Base
from app.schemas.file import FileStatus

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True)
    filename = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(SQLEnum(FileStatus), default=FileStatus.UPLOADING, nullable=False)
    error_message = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("filename", "user_id", name="unique_user_file"),
    )
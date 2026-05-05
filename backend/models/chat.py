from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, func, text
from db import Base


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    query = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    source = Column(String(20), index=True, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    clicks = Column(Integer, server_default=text("0"), nullable=False)

    # Legacy fields for older chat history rows.
    role = Column(String, nullable=True)
    content = Column(Text, nullable=True)

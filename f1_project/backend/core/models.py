from pydantic import BaseModel


class EmailData(BaseModel):
    name: str
    email: str
    message: str

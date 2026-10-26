from pydantic import BaseModel, EmailStr # pyright: ignore[reportMissingImports]

class LoginSchema(BaseModel):
    correo: EmailStr
    password: str

class RegisterSchema(BaseModel):
    nombres: str
    apellidos: str
    id_TipoDoc: str
    numeroDoc: str
    email: EmailStr
    password: str
    telefono: str
    direccion: str
    genero: str
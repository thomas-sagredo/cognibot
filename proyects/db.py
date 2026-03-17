from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Permitir sobreescribir por variable de entorno para despliegues con Docker
DATABASE_URL = os.environ.get("DATABASE_URL", "mysql+pymysql://admin:sis2018Eze*@154.2.8.21:3306/phpMyAdmin")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from sqlmodel import SQLModel
import app.models  # juste pour déclencher l'enregistrement des tables
from app.database import engine

SQLModel.metadata.create_all(engine)
print("Toutes les tables ont été créées avec succès.")
print(f"Nombre de tables : {len(SQLModel.metadata.tables)}")
for table_name in sorted(SQLModel.metadata.tables.keys()):
    print(f"  - {table_name}")
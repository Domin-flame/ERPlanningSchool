#!/bin/sh
set -e

# Attendre que PostgreSQL soit prêt (au cas où le healthcheck n'est pas suffisant)
echo "[entrypoint] Démarrage du service Auth..."

# Exécuter le seed des comptes de démonstration si DB_AUTO_SEED=true
if [ "${DB_AUTO_SEED}" = "true" ]; then
    echo "[entrypoint] Seeding des comptes de démonstration..."
    python -c "
import os
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from passlib.context import CryptContext
from app.database import engine

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

DEMO_ACCOUNTS = [
    ('Dr. Élisabeth Durand', 'academic@campus.edu', 'password123', 'academic'),
    ('Dr. Marc Dubois', 'professeur@campus.edu', 'password123', 'professeur'),
    ('Alexandre Martin', 'student@campus.edu', 'password123', 'student'),
    ('Claire Lefebvre', 'rh@campus.edu', 'password123', 'rh'),
    ('Jean-Pierre Dupuis', 'finance@campus.edu', 'password123', 'finance'),
    ('Elodie Fontaine', 'marketing@campus.edu', 'password123', 'marketing'),
]

with engine.connect() as conn:
    # Créer la table si elle n'existe pas
    conn.execute(text('''
        CREATE TABLE IF NOT EXISTS user_account (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR NOT NULL,
            email VARCHAR UNIQUE NOT NULL,
            hashed_password VARCHAR NOT NULL,
            role VARCHAR DEFAULT 'student',
            created_at TIMESTAMP DEFAULT NOW()
        )
    '''))
    conn.commit()

    for full_name, email, password, role in DEMO_ACCOUNTS:
        hashed = pwd_context.hash(password)
        conn.execute(text('''
            INSERT INTO user_account (full_name, email, hashed_password, role)
            VALUES (:full_name, :email, :hashed, :role)
            ON CONFLICT (email) DO NOTHING
        '''), {'full_name': full_name, 'email': email, 'hashed': hashed, 'role': role})
    conn.commit()

print('[entrypoint] Seed terminé : 6 comptes de démonstration vérifiés/créés.')
" || echo "[entrypoint] Avertissement : le seed a échoué (peut-être déjà fait)."
fi

# Lancer la commande principale (uvicorn)
exec "$@"

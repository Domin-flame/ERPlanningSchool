"""
Tests automatisés pour l'API Globetrotter
"""
import sys
import os
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_USER = {
    "username": "test_user_" + datetime.now().strftime("%Y%m%d%H%M%S"),
    "password": "testpass123",
    "preferences": ["nature", "food"]
}
ADMIN_USER = {
    "username": "admin",
    "password": "admin123"
}

# Variables globales pour les tests
user_token = None
admin_token = None
test_destination_name = "Le Bar Royal Zèbre"
test_review_id = None
test_proposal_id = None

# Couleurs pour l'affichage
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_test(test_name):
    """Afficher le nom du test."""
    print(f"\n{BLUE}🧪 Test: {test_name}{RESET}")


def print_success(message):
    """Afficher un succès."""
    print(f"{GREEN}✅ {message}{RESET}")


def print_error(message):
    """Afficher une erreur."""
    print(f"{RED}❌ {message}{RESET}")


def print_info(message):
    """Afficher une info."""
    print(f"{YELLOW}ℹ️  {message}{RESET}")


# =============================================================================
# TESTS AUTHENTICATION
# =============================================================================

def test_register():
    """Test 1: Inscription d'un nouvel utilisateur"""
    print_test("Inscription d'un nouvel utilisateur")
    
    response = requests.post(
        f"{BASE_URL}/register",
        json=TEST_USER
    )
    
    if response.status_code == 201:
        print_success("Utilisateur créé avec succès")
        return True
    else:
        print_error(f"Échec de l'inscription: {response.json()}")
        return False


def test_login():
    """Test 2: Connexion utilisateur"""
    global user_token
    print_test("Connexion utilisateur")
    
    response = requests.post(
        f"{BASE_URL}/login",
        json={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        user_token = data.get("token")
        print_success(f"Connexion réussie - Token: {user_token[:20]}...")
        return True
    else:
        print_error(f"Échec de la connexion: {response.json()}")
        return False


def test_admin_login():
    """Test 3: Connexion admin"""
    global admin_token
    print_test("Connexion admin")
    
    response = requests.post(
        f"{BASE_URL}/admin/login",
        json=ADMIN_USER
    )
    
    if response.status_code == 200:
        data = response.json()
        admin_token = data.get("token")
        print_success(f"Admin connecté - Token: {admin_token[:20]}...")
        return True
    else:
        print_error(f"Échec connexion admin: {response.json()}")
        return False


# =============================================================================
# TESTS DESTINATIONS
# =============================================================================

def test_get_destinations():
    """Test 4: Récupérer la liste des destinations"""
    print_test("Récupération des destinations")
    
    response = requests.get(f"{BASE_URL}/destinations")
    
    if response.status_code == 200:
        destinations = response.json()
        print_success(f"Liste récupérée - {len(destinations)} destinations")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


def test_search_destinations():
    """Test 5: Recherche de destinations"""
    print_test("Recherche avec filtres")
    
    response = requests.get(
        f"{BASE_URL}/destinations",
        params={"q": "royal", "tag": "food"}
    )
    
    if response.status_code == 200:
        results = response.json()
        print_success(f"Recherche réussie - {len(results)} résultats")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


# =============================================================================
# TESTS REVIEWS
# =============================================================================

def test_create_review():
    """Test 6: Créer un avis"""
    global test_review_id
    print_test("Création d'un avis")
    
    if not user_token:
        print_error("Token utilisateur manquant")
        return False
    
    response = requests.post(
        f"{BASE_URL}/reviews",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "destination_name": test_destination_name,
            "rating": 5,
            "comment": "Test automatisé - Destination incroyable !"
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        test_review_id = data.get("id")
        print_success(f"Avis créé - ID: {test_review_id}")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


def test_get_reviews():
    """Test 7: Récupérer les avis d'une destination"""
    print_test("Récupération des avis")
    
    response = requests.get(
        f"{BASE_URL}/reviews",
        params={"destination": test_destination_name}
    )
    
    if response.status_code == 200:
        reviews = response.json()
        print_success(f"Avis récupérés - {len(reviews)} avis")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


def test_delete_review():
    """Test 8: Supprimer un avis"""
    print_test("Suppression d'un avis")
    
    if not user_token or not test_review_id:
        print_error("Token ou ID manquant")
        return False
    
    response = requests.delete(
        f"{BASE_URL}/reviews/{test_review_id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    if response.status_code == 200:
        print_success("Avis supprimé")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


# =============================================================================
# TESTS VISITED
# =============================================================================

def test_mark_visited():
    """Test 9: Marquer une destination comme visitée"""
    print_test("Marquer comme visité")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.post(
        f"{BASE_URL}/visited",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"destination_name": test_destination_name}
    )
    
    if response.status_code == 200:
        print_success(f"{test_destination_name} marqué comme visité")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


def test_get_visited():
    """Test 10: Récupérer les destinations visitées"""
    print_test("Récupération des destinations visitées")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.get(
        f"{BASE_URL}/visited",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    if response.status_code == 200:
        visited = response.json()
        print_success(f"Liste récupérée - {len(visited)} destinations")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


# =============================================================================
# TESTS FAVORITE NOTES
# =============================================================================

def test_create_favorite_note():
    """Test 11: Créer une note sur un favori"""
    print_test("Création d'une note personnelle")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.post(
        f"{BASE_URL}/favorite-notes",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "destination_name": test_destination_name,
            "note": "Test automatisé - Je veux visiter en été",
            "visit_date": "Été 2025",
            "companions": "En famille",
            "budget": 3000
        }
    )
    
    if response.status_code == 200:
        print_success("Note créée avec succès")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


def test_get_favorite_notes():
    """Test 12: Récupérer les notes"""
    print_test("Récupération des notes")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.get(
        f"{BASE_URL}/favorite-notes",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    if response.status_code == 200:
        notes = response.json()
        print_success(f"Notes récupérées - {len(notes)} notes")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


# =============================================================================
# TESTS PROPOSALS
# =============================================================================

def test_submit_proposal():
    """Test 13: Soumettre une proposition de destination"""
    global test_proposal_id
    print_test("Soumission d'une proposition")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.post(
        f"{BASE_URL}/proposals",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "name": "Test Destination",
            "country": "Test Country",
            "continent": "Test Continent",
            "description": "Ceci est une destination de test automatisé",
            "tags": ["test", "automation"],
            "avg_cost_per_day": 100
        }
    )
    
    if response.status_code == 201:
        data = response.json()
        test_proposal_id = data.get("proposal", {}).get("id")
        print_success(f"Proposition soumise - ID: {test_proposal_id}")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


def test_get_user_proposals():
    """Test 14: Récupérer ses propositions"""
    print_test("Récupération des propositions utilisateur")
    
    if not user_token:
        print_error("Token manquant")
        return False
    
    response = requests.get(
        f"{BASE_URL}/proposals",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    if response.status_code == 200:
        proposals = response.json()
        print_success(f"Propositions récupérées - {len(proposals)} propositions")
        return True
    else:
        print_error(f"Échec: {response.status_code}")
        return False


def test_admin_get_proposals():
    """Test 15: Admin - Récupérer toutes les propositions"""
    print_test("Admin - Récupération de toutes les propositions")
    
    if not admin_token:
        print_error("Token admin manquant")
        return False
    
    response = requests.get(
        f"{BASE_URL}/admin/proposals",
        headers={"Authorization": f"Bearer {admin_token}"},
        params={"status": "pending"}
    )
    
    if response.status_code == 200:
        proposals = response.json()
        print_success(f"Propositions en attente - {len(proposals)} propositions")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


def test_admin_approve_proposal():
    """Test 16: Admin - Approuver une proposition"""
    print_test("Admin - Approbation d'une proposition")
    
    if not admin_token or not test_proposal_id:
        print_error("Token admin ou ID manquant")
        return False
    
    response = requests.post(
        f"{BASE_URL}/admin/proposals/{test_proposal_id}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"comment": "Test automatisé - Approuvé"}
    )
    
    if response.status_code == 200:
        print_success("Proposition approuvée et ajoutée aux destinations")
        return True
    else:
        print_error(f"Échec: {response.json()}")
        return False


# =============================================================================
# EXÉCUTION DES TESTS
# =============================================================================

def run_all_tests():
    """Exécuter tous les tests"""
    print(f"\n{BLUE}{'='*60}")
    print(f"🚀 TESTS AUTOMATISÉS - GLOBETROTTER API")
    print(f"{'='*60}{RESET}\n")
    
    print_info(f"URL de base: {BASE_URL}")
    print_info(f"Utilisateur test: {TEST_USER['username']}")
    
    tests = [
        # Authentication
        ("Inscription", test_register),
        ("Connexion utilisateur", test_login),
        ("Connexion admin", test_admin_login),
        
        # Destinations
        ("Liste destinations", test_get_destinations),
        ("Recherche destinations", test_search_destinations),
        
        # Reviews
        ("Créer avis", test_create_review),
        ("Lister avis", test_get_reviews),
        ("Supprimer avis", test_delete_review),
        
        # Visited
        ("Marquer visité", test_mark_visited),
        ("Lister visités", test_get_visited),
        
        # Favorite Notes
        ("Créer note", test_create_favorite_note),
        ("Lister notes", test_get_favorite_notes),
        
        # Proposals
        ("Soumettre proposition", test_submit_proposal),
        ("Lister propositions user", test_get_user_proposals),
        ("Admin lister propositions", test_admin_get_proposals),
        ("Admin approuver proposition", test_admin_approve_proposal),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            failed += 1
    
    # Résumé
    print(f"\n{BLUE}{'='*60}")
    print(f"📊 RÉSUMÉ DES TESTS")
    print(f"{'='*60}{RESET}\n")
    
    total = passed + failed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"{GREEN}✅ Tests réussis: {passed}/{total}{RESET}")
    print(f"{RED}❌ Tests échoués: {failed}/{total}{RESET}")
    print(f"{YELLOW}📈 Taux de réussite: {success_rate:.1f}%{RESET}\n")
    
    if failed == 0:
        print(f"{GREEN}🎉 TOUS LES TESTS SONT PASSÉS !{RESET}\n")
    else:
        print(f"{RED}⚠️  CERTAINS TESTS ONT ÉCHOUÉ{RESET}\n")
    
    return failed == 0


if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrompus par l'utilisateur{RESET}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Erreur fatale: {str(e)}{RESET}\n")
        sys.exit(1)

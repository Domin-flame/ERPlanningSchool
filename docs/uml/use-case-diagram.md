# Diagramme de cas d'utilisation

> Mermaid n'a pas de syntaxe UML "use case" dédiée — ce diagramme est
> rendu comme un graphe orienté (convention standard pour représenter des
> cas d'utilisation en Mermaid) : les acteurs sont à gauche, les cas
> d'utilisation sont les nœuds arrondis, regroupés par module (`subgraph`).

```mermaid
flowchart LR
    Academic((Academic))
    Prof((Professeur))
    Student((Student))
    RH((RH))
    Finance((Finance))
    Marketing((Marketing))

    subgraph SG1 ["Auth"]
        UC1(["S'inscrire / Se connecter"])
        UC2(["Rafraîchir la session"])
        UC3(["Se déconnecter"])
    end

    subgraph SG2 ["Académique"]
        UC4(["Gérer programmes & cours"])
        UC5(["S'inscrire à un cours"])
        UC6(["Saisir les notes"])
        UC7(["Planifier un examen"])
        UC8(["Consulter son relevé de notes"])
    end

    subgraph SG3 ["Finance & Marketing"]
        UC9(["Consulter / Payer une facture"])
        UC10(["Gérer les campagnes marketing"])
        UC11(["Générer le rapport financier mensuel"])
    end

    subgraph SG4 ["RH"]
        UC12(["Gérer le dossier employé"])
        UC13(["Calculer la paie mensuelle"])
        UC14(["Demander / approuver un congé"])
        UC15(["Pointer par QR code"])
    end

    subgraph SG5 ["Messagerie"]
        UC16(["Envoyer un message"])
        UC17(["Consulter ses notifications"])
    end

    Academic --> UC1 & UC2 & UC3 & UC4 & UC7 & UC11
    Prof --> UC1 & UC2 & UC3 & UC6 & UC16 & UC17
    Student --> UC1 & UC2 & UC3 & UC5 & UC8 & UC9 & UC16 & UC17
    RH --> UC1 & UC2 & UC3 & UC12 & UC13 & UC14 & UC15 & UC17
    Finance --> UC1 & UC2 & UC3 & UC9 & UC11 & UC17
    Marketing --> UC1 & UC2 & UC3 & UC10 & UC17

    UC5 -. "déclenche (async)" .-> UC9
```

## Notes de lecture
- **UC5 → UC9** (pointillé "déclenche async") représente le flux
  transverse imposé par l'énoncé : une inscription réussie
  (`academic-service`) déclenche, via RabbitMQ, la création automatique
  d'une facture (`finance-service`) — voir
  [`sequence-enrollment-async.md`](./sequence-enrollment-async.md) pour le
  détail temporel de ce flux.
- Tous les rôles partagent les cas d'utilisation du module Auth (UC1-UC3)
  et de Messagerie (UC16-UC17), communs à toute l'application.

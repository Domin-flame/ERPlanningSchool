# Suite de diagrammes UML — CampusWorkflow

Diagrammes rédigés en [Mermaid](https://mermaid.js.org/), qui s'affichent
nativement sur GitHub/GitLab. Pour exporter en image (PNG/SVG) pour un
rapport PDF ou une annexe imprimée, collez le contenu de chaque bloc
` ```mermaid ` dans l'éditeur en ligne [mermaid.live](https://mermaid.live)
et exportez.

Ces diagrammes reflètent le code **réellement livré** (et non un schéma
théorique) — voir `docs/BUG_TRACKING.md` #16 pour l'historique d'une
incohérence corrigée entre schéma SQL et modèles applicatifs.

| Fichier | Contenu | Exigence couverte |
|---|---|---|
| [`use-case-diagram.md`](./use-case-diagram.md) | Cas d'utilisation par rôle | Diagramme de cas d'utilisation (obligatoire) |
| [`class-diagram.md`](./class-diagram.md) | Classes principales (Academic, Finance, HR, Auth) | Diagramme de classes (obligatoire) |
| [`sequence-login.md`](./sequence-login.md) | Séquence : connexion + rotation de refresh token | 1 des 2 diagrammes de séquence requis |
| [`sequence-enrollment-async.md`](./sequence-enrollment-async.md) | Séquence : inscription → événement RabbitMQ → facture | Le diagramme de séquence **couvrant le workflow asynchrone** (obligatoire) |
| [`erd.md`](./erd.md) | Modèle entité-association par service | ERD (obligatoire) |
| [`deployment-diagram.md`](./deployment-diagram.md) | Conteneurs, réseau, message broker | Diagramme de déploiement (obligatoire) |

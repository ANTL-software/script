# Supports historiques

`script-supports-legacy.json` est un instantané des plans d’appel et objections
historiques Cigales, MMA et FGA, identique à
`olympe/assets/script-supports/legacy.json` lors de son introduction.

Le test de Script compare ses contenus historiques à cette fixture versionnée.
Il doit fonctionner dans un checkout isolé, sans accès au dépôt Olympe voisin.
Toute évolution intentionnelle du contrat partagé doit mettre à jour les deux
instantanés et leurs tests dans les dépôts concernés.

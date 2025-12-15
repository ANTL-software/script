import './typeFicheBadge.scss';
import type { TypeFiche } from '../../../utils/types';

interface TypeFicheBadgeProps {
  typeFiche: TypeFiche;
}

const TYPE_FICHE_CONFIG = {
  jamais_appele: {
    label: 'Jamais appelé',
    color: 'green',
  },
  deja_appele: {
    label: 'Déjà appelé',
    color: 'orange',
  },
  recycle: {
    label: 'Recyclé',
    color: 'blue',
  },
  client: {
    label: 'Client',
    color: 'purple',
  },
} as const;

export default function TypeFicheBadge({ typeFiche }: TypeFicheBadgeProps) {
  const config = TYPE_FICHE_CONFIG[typeFiche];

  return (
    <span className={`type-fiche-badge type-fiche-badge--${config.color}`}>
      {config.label}
    </span>
  );
}

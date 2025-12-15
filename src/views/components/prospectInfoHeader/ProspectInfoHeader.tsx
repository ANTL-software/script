import './prospectInfoHeader.scss';
import type { Prospect } from '../../../utils/types';
import { ProspectModel } from '../../../API/models';
import TypeFicheBadge from '../typeFicheBadge/TypeFicheBadge';

interface ProspectInfoHeaderProps {
  prospect: Prospect;
}

export default function ProspectInfoHeader({ prospect }: ProspectInfoHeaderProps) {
  const prospectModel = ProspectModel.fromJSON(prospect);

  return (
    <div className="prospect-info-header">
      <div className="prospect-info-header__title">
        <h1>{prospectModel.fullName}</h1>
        <TypeFicheBadge typeFiche={prospectModel.typeFiche} />
      </div>

      <table className="prospect-info-table">
        <tbody>
          <tr>
            <td className="label">Nom</td>
            <td className="value">{prospect.nom}</td>
            <td className="label">Prénom</td>
            <td className="value">{prospect.prenom || '-'}</td>
          </tr>
          <tr>
            <td className="label">Téléphone</td>
            <td className="value">{prospect.telephone}</td>
            <td className="label">Email</td>
            <td className="value">{prospect.email || '-'}</td>
          </tr>
          <tr>
            <td className="label">Ville</td>
            <td className="value">{prospect.ville || '-'}</td>
            <td className="label">Type</td>
            <td className="value">{prospect.type_prospect}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

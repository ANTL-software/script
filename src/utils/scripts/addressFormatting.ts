export function capitalizeAddress(value: string): string {
  return value.normalize('NFC').trim().replace(/[^\S\r\n]+/g, ' ').toLocaleLowerCase('fr-FR')
    .replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_match: string, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase('fr-FR'));
}

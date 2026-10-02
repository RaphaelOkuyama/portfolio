// Certificados agrupados por área, com a contagem que vira o resumo do topo da página.
// Uma trilha (modules) é um item da lista, mas cada módulo é um certificado.

export const AREA_ORDER = ['full', 'front', 'back', 'base'];

export function certCount(item) {
  return item.modules ? item.modules.length : 1;
}

export function groupByArea(certificates, order = AREA_ORDER) {
  return order
    .map((area) => {
      const items = certificates.filter((c) => c.area === area);
      return { area, items, count: items.reduce((n, c) => n + certCount(c), 0) };
    })
    .filter((group) => group.items.length > 0);
}

export function summaryText(template, certificates) {
  const certs = certificates.reduce((n, c) => n + certCount(c), 0);
  const bootcamps = certificates.filter((c) => c.kind === 'bootcamp').length;
  const formations = certificates.filter((c) => c.kind === 'formation').length;
  return template
    .replace('{certs}', certs)
    .replace('{bootcamps}', bootcamps)
    .replace('{formations}', formations);
}

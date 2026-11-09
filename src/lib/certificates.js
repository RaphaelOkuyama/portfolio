// Certificados agrupados por área, com a contagem que vira o resumo do topo da página.
// Uma trilha (modules) é um item da lista, mas cada módulo é um certificado.
// Cada certificado traz a data (AAAA-MM-DD), a carga horária e a imagem da primeira página do PDF
// (public/certificates; o CPF que aparecia em um deles foi coberto)

export const AREA_ORDER = ['full', 'front', 'back', 'base'];

export function certCount(item) {
  return item.modules ? item.modules.length : 1;
}

// Data do item: a trilha termina no módulo mais recente
export function certDate(item) {
  const dates = item.modules ? item.modules.map((m) => m.date) : [item.date];
  return dates.filter(Boolean).sort().at(-1) ?? '';
}

// Carga horária do item (a trilha soma os módulos)
export function certHours(item) {
  if (item.modules) return item.modules.reduce((sum, m) => sum + (m.hours ?? 0), 0);
  return item.hours ?? 0;
}

// A formação (o programa completo) abre a área; depois, do mais recente para o mais antigo
// (empate: a ordem dos dados). `count` são as linhas da lista: no filtro, "Fundamentos 8" com 3
// linhas na tela parecia que algo tinha sumido (a trilha mostra os módulos dentro dela)
const weight = (c) => (c.kind === 'formation' ? 0 : 1);

export function groupByArea(certificates, order = AREA_ORDER) {
  return order
    .map((area) => {
      const items = certificates
        .filter((c) => c.area === area)
        .sort((a, b) => weight(a) - weight(b) || certDate(b).localeCompare(certDate(a)));
      return { area, items, count: items.length };
    })
    .filter((group) => group.items.length > 0);
}

// Chave de um certificado (o item, ou o módulo da trilha): liga o botão da lista ao visualizador
export function certKey(item, moduleIndex = null) {
  return moduleIndex === null ? String(item.id) : `${item.id}-${moduleIndex}`;
}

// O que o visualizador percorre, na ordem da página: cada módulo de trilha é um certificado
export function viewerEntries(certificates, order = AREA_ORDER) {
  return groupByArea(certificates, order).flatMap(({ items }) => items.flatMap((c) => {
    const base = { area: c.area, institution: c.institution };
    if (!c.modules) {
      return [{ ...base, key: certKey(c), name: c.name, date: c.date, hours: c.hours, image: c.image }];
    }
    return c.modules.map((m, i) => ({
      ...base, key: certKey(c, i), name: `${c.name} · ${m.label}`, date: m.date, hours: m.hours, image: m.image,
    }));
  }));
}

// Horas de estudo sem contar duas vezes: a formação já inclui os cursos avulsos da mesma escola
// (os certificados de cada curso saem ao longo dela), então eles ficam fora da soma
export function studyHours(certificates) {
  const schools = new Set(certificates.filter((c) => c.kind === 'formation').map((c) => c.institution));
  return certificates
    .filter((c) => c.kind === 'formation' || !schools.has(c.institution))
    .reduce((sum, c) => sum + certHours(c), 0);
}

export function summaryText(template, certificates) {
  const certs = certificates.reduce((n, c) => n + certCount(c), 0);
  const bootcamps = certificates.filter((c) => c.kind === 'bootcamp').length;
  const formations = certificates.filter((c) => c.kind === 'formation').length;
  return template
    .replace('{certs}', certs)
    .replace('{bootcamps}', bootcamps)
    .replace('{formations}', formations)
    .replace('{hours}', studyHours(certificates));
}

// Graduação: em andamento até o mês de conclusão, concluída depois dele ('AAAA-MM')
export function degreeDone(end, today = new Date()) {
  const now = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  return now > end;
}

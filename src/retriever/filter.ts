export type DocFilter = (doc: any) => boolean;

export function combine(...filters: (DocFilter | undefined)[]): DocFilter | undefined {
  const active = filters.filter((f): f is DocFilter => typeof f === 'function');
  if (active.length === 0) return undefined;
  return doc => active.every(f => f(doc));
}

export function byType(type: string): DocFilter {
  return doc => doc.metadata?.type === type;
}

export function byState(...states: string[]): DocFilter {
  return doc => states.includes(String(doc.metadata?.state));
}

export function byPriority(...priorities: string[]): DocFilter {
  return doc => priorities.includes(String(doc.metadata?.priority));
}

export function byAssignmentGroup(group: string): DocFilter {
  return doc => doc.metadata?.assignment_group === group;
}

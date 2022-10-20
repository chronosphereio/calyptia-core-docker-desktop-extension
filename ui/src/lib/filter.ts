import type { VivoStdoutEventData, } from './vivo'

interface Includes {
  includes: string
}

interface Equals {
  key: string
  equals: unknown
}

interface Regex {
  key: string
  matches: RegExp
}

interface Or {
  or: Filter[]
}

interface And {
  and: Filter[]
}

export type Filter = Includes | Equals | Regex | Or | And

function recordMatchesIncludes(includes: Includes, record: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(record)) {
    if (k.includes(includes.includes) || (typeof v === "string" && v.includes(includes.includes))) {
      return true
    }
  }
  return false
}

function recordMatchesEquals(equals: Equals, record: Record<string, unknown>): boolean {
  const value = record[equals.key]
  if (value == null) {
    return false
  }
  return value === equals.equals
}

function recordMatchesRegex(regex: Regex, record: Record<string, unknown>): boolean {
  const value = record[regex.key]
  if (typeof value !== 'string') {
    return false;
  }
  return regex.matches.test(value)
}

function recordMatchesOr(or: Or, record: Record<string, unknown>): boolean {
  let rv = false

  for (const f of or.or) {
    rv = rv || recordMatchesFilter(f, record)
    if (rv) {
      break;
    }
  }

  return rv;
}

function recordMatchesAnd(and: And, record: Record<string, unknown>): boolean {
  let rv = true;

  for (const f of and.and) {
    rv = rv && recordMatchesFilter(f, record)
    if (!rv) {
      break;
    }
  }

  return rv;
}

export function recordMatchesFilter(filter: Filter, record: Record<string, unknown>): boolean {
  if ('or' in filter) {
    return recordMatchesOr(filter, record);
  } else if ('and' in filter) {
    return recordMatchesAnd(filter, record);
  } else if ('matches' in filter) {
    return recordMatchesRegex(filter, record);
  } else if ('includes' in filter) {
    return recordMatchesIncludes(filter, record);
  } else {
    return recordMatchesEquals(filter, record);
  }
}

export function applyFilter(filter: Filter, records: Record<string, unknown>[]) {
  return records.filter(r => recordMatchesFilter(filter, r));
}

export function applyVivoFilter(filter: Filter, records: VivoStdoutEventData[]) {
  return records.filter(r => recordMatchesFilter(filter, r.data));
}

// Temporary hack that allows users to type in a filter without creating a proper query language
export function jsonToFilter(json: string): Filter {
  const parsed: unknown = JSON.parse(json);

  function convert(obj: unknown): Filter {
    if (Array.isArray(obj['or'])) {
      return { or: obj['or'].map(convert) }
    } else if (Array.isArray(obj['and'])) {
      return { and: obj['and'].map(convert) }
    } else if (typeof obj !== 'object') {
      throw new Error(`Invalid filter "${JSON.stringify(obj)}"`)
    } else if (typeof obj['key'] === 'string' && typeof obj['matches'] === 'string') {
      return { key: obj['key'], matches: new RegExp(obj['matches'], obj['flags'] || '') }
    } else if (typeof obj['key'] === 'string' && 'equals' in obj) {
      return { key: obj['key'], equals: obj['equals'] }
    } else if (typeof obj['includes'] === "string") {
      return { includes: obj['includes'].toString() }
    } else {
      throw new Error(`Invalid filter "${JSON.stringify(obj)}"`)
    }
  }

  return convert(parsed);
}

export function stringToIncludes(str: string): Includes {
  return { includes: str }
}

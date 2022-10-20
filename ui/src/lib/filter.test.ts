import { applyFilter, jsonToFilter } from './filter'

describe('applyFilter', () => {
  const data = [
    {date: 0, log: "line 0"},
    {date: 1, log: "line 1"},
    {date: 2, log: "line 2"},
    {date: 3, log: "line 3"},
    {date: 4, log: "line 4"},
    {date: 5, log: "line 5"},
    {date: 6, log: "line 6"},
    {date: 7, log: "line 7"},
    {date: 8, log: "line 8"},
    {date: 9, log: "line 9"},
  ] as Record<string, unknown>[]


  it('handles empty and/or filters', () => {
    expect(applyFilter({ or: [] }, data)).toEqual([]);
    expect(applyFilter({ and: [] }, data)).toEqual(data);
  })

  it('accepts "equals" filters', () => {
    expect(applyFilter({ key: "date", equals: 2 }, data)).toEqual([
      {date: 2, log: "line 2"}
    ]);
    expect(applyFilter({ key: "log", equals: "line 7" }, data)).toEqual([
      {date: 7, log: "line 7"}
    ]);
  })

  it('accepts "regex" filters', () => {
    expect(applyFilter({ key: "log", matches: /LINE (7|8|9)/i }, data)).toEqual([
      {date: 7, log: "line 7"},
      {date: 8, log: "line 8"},
      {date: 9, log: "line 9"},
    ]);
  })

  it('accepts "or" filters', () => {
    expect(applyFilter({or: [
      { key: "date", equals: 2 },
      { key: "log", equals: "line 7" },
    ]}, data)).toEqual([
      {date: 2, log: "line 2"},
      {date: 7, log: "line 7"}
    ]);

    expect(applyFilter({or: [
      { key: "date", equals: "2" },
      { key: "log", equals: "line 7" },
    ]}, data)).toEqual([
      {date: 7, log: "line 7"}
    ]);
  });

  it('accepts "and" filters', () => {
    expect(applyFilter({and: [
      { key: "date", equals: 2 },
      { key: "log", equals: "line 2" },
    ]}, data)).toEqual([
      {date: 2, log: "line 2"},
    ]);

    expect(applyFilter({and: [
      { key: "date", equals: 2 },
      { key: "log", equals: "line 7" },
    ]}, data)).toEqual([]);
  });

  it('accepts nested filters', () => {
    const filter = {
      or: [
        { key: "date", equals: 1 },
        { and: [
          { key: "log", matches: /line (3|5)$/ },
          { key: "date", equals: 5 }
          ]
        },
        { key: "log", matches: /(7|6)/ },
      ]
    }
    expect(applyFilter(filter, data)).toEqual([
      {date: 1, log: "line 1"},
      {date: 5, log: "line 5"},
      {date: 6, log: "line 6"},
      {date: 7, log: "line 7"},
    ]);
  });
})

describe('jsonToFilter', () => {
  it('converts a json string to a filter object', () => {
    const filter = {
      or: [
        { key: "date", equals: 1 },
        { and: [
          { key: "log", matches: /line (3|5)$/i },
          { key: "date", equals: 5 }
          ]
        },
        { key: "log", matches: /(7|6)/ },
      ]
    }

    const json = `{
      "or": [
        { "key": "date", "equals": 1 },
        { "and": [
          { "key": "log", "matches": "line (3|5)$", "flags": "i" },
          { "key": "date", "equals": 5 }
          ]
        },
        { "key": "log", "matches": "(7|6)" }
      ]
    }`

    expect(jsonToFilter(json)).toEqual(filter);
  });
});

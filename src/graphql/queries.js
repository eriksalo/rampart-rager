/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getRaceResult = /* GraphQL */ `
  query GetRaceResult($id: ID!) {
    getRaceResult(id: $id) {
      id
      bib
      firstName
      lastName
      elapsedTime
      race
      category
      gender
      place
      finishTime
      startTime
      age
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listRaceResults = /* GraphQL */ `
  query ListRaceResults(
    $filter: ModelRaceResultFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRaceResults(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        bib
        firstName
        lastName
        elapsedTime
        race
        category
        gender
        place
        finishTime
        startTime
        age
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncRaceResults = /* GraphQL */ `
  query SyncRaceResults(
    $filter: ModelRaceResultFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRaceResults(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        bib
        firstName
        lastName
        elapsedTime
        race
        category
        gender
        place
        finishTime
        startTime
        age
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getRaceMeta = /* GraphQL */ `
  query GetRaceMeta($id: ID!) {
    getRaceMeta(id: $id) {
      id
      raceName
      raceDate
      lastUpdated
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const listRaceMetas = /* GraphQL */ `
  query ListRaceMetas(
    $filter: ModelRaceMetaFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRaceMetas(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        raceName
        raceDate
        lastUpdated
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncRaceMetas = /* GraphQL */ `
  query SyncRaceMetas(
    $filter: ModelRaceMetaFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRaceMetas(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        raceName
        raceDate
        lastUpdated
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;

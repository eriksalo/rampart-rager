/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateRaceResult = /* GraphQL */ `
  subscription OnCreateRaceResult(
    $filter: ModelSubscriptionRaceResultFilterInput
  ) {
    onCreateRaceResult(filter: $filter) {
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
export const onUpdateRaceResult = /* GraphQL */ `
  subscription OnUpdateRaceResult(
    $filter: ModelSubscriptionRaceResultFilterInput
  ) {
    onUpdateRaceResult(filter: $filter) {
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
export const onDeleteRaceResult = /* GraphQL */ `
  subscription OnDeleteRaceResult(
    $filter: ModelSubscriptionRaceResultFilterInput
  ) {
    onDeleteRaceResult(filter: $filter) {
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
export const onCreateRaceMeta = /* GraphQL */ `
  subscription OnCreateRaceMeta($filter: ModelSubscriptionRaceMetaFilterInput) {
    onCreateRaceMeta(filter: $filter) {
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
export const onUpdateRaceMeta = /* GraphQL */ `
  subscription OnUpdateRaceMeta($filter: ModelSubscriptionRaceMetaFilterInput) {
    onUpdateRaceMeta(filter: $filter) {
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
export const onDeleteRaceMeta = /* GraphQL */ `
  subscription OnDeleteRaceMeta($filter: ModelSubscriptionRaceMetaFilterInput) {
    onDeleteRaceMeta(filter: $filter) {
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

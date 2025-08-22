/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createRaceResult = /* GraphQL */ `
  mutation CreateRaceResult(
    $input: CreateRaceResultInput!
    $condition: ModelRaceResultConditionInput
  ) {
    createRaceResult(input: $input, condition: $condition) {
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
export const updateRaceResult = /* GraphQL */ `
  mutation UpdateRaceResult(
    $input: UpdateRaceResultInput!
    $condition: ModelRaceResultConditionInput
  ) {
    updateRaceResult(input: $input, condition: $condition) {
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
export const deleteRaceResult = /* GraphQL */ `
  mutation DeleteRaceResult(
    $input: DeleteRaceResultInput!
    $condition: ModelRaceResultConditionInput
  ) {
    deleteRaceResult(input: $input, condition: $condition) {
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
export const createRaceMeta = /* GraphQL */ `
  mutation CreateRaceMeta(
    $input: CreateRaceMetaInput!
    $condition: ModelRaceMetaConditionInput
  ) {
    createRaceMeta(input: $input, condition: $condition) {
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
export const updateRaceMeta = /* GraphQL */ `
  mutation UpdateRaceMeta(
    $input: UpdateRaceMetaInput!
    $condition: ModelRaceMetaConditionInput
  ) {
    updateRaceMeta(input: $input, condition: $condition) {
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
export const deleteRaceMeta = /* GraphQL */ `
  mutation DeleteRaceMeta(
    $input: DeleteRaceMetaInput!
    $condition: ModelRaceMetaConditionInput
  ) {
    deleteRaceMeta(input: $input, condition: $condition) {
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

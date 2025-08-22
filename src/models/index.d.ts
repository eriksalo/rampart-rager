import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerRaceResult = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RaceResult, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly bib: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly elapsedTime: string;
  readonly race: string;
  readonly category: string;
  readonly gender: string;
  readonly place: number;
  readonly finishTime?: string | null;
  readonly startTime?: string | null;
  readonly age?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRaceResult = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RaceResult, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly bib: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly elapsedTime: string;
  readonly race: string;
  readonly category: string;
  readonly gender: string;
  readonly place: number;
  readonly finishTime?: string | null;
  readonly startTime?: string | null;
  readonly age?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type RaceResult = LazyLoading extends LazyLoadingDisabled ? EagerRaceResult : LazyRaceResult

export declare const RaceResult: (new (init: ModelInit<RaceResult>) => RaceResult) & {
  copyOf(source: RaceResult, mutator: (draft: MutableModel<RaceResult>) => MutableModel<RaceResult> | void): RaceResult;
}

type EagerRaceMeta = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RaceMeta, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly raceName: string;
  readonly raceDate: string;
  readonly lastUpdated: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyRaceMeta = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<RaceMeta, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly raceName: string;
  readonly raceDate: string;
  readonly lastUpdated: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type RaceMeta = LazyLoading extends LazyLoadingDisabled ? EagerRaceMeta : LazyRaceMeta

export declare const RaceMeta: (new (init: ModelInit<RaceMeta>) => RaceMeta) & {
  copyOf(source: RaceMeta, mutator: (draft: MutableModel<RaceMeta>) => MutableModel<RaceMeta> | void): RaceMeta;
}
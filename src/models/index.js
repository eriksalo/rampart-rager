// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { RaceResult, RaceMeta } = initSchema(schema);

export {
  RaceResult,
  RaceMeta
};
import type {
  ApiExperimentRecord,
  ApiModelRecord,
  ApiBlueprintRecord,
  ApiUserRecord,
} from '@/lib/data-utils';

export const mockApiUsers = (): ApiUserRecord[] => [];

export const mockApiExperiments = (): ApiExperimentRecord[] => [];

export const mockApiModels = (): ApiModelRecord[] => [];

export const mockApiBlueprints = (): ApiBlueprintRecord[] => [];

export const mockMeta = () => ({
  indicators: [],
  features: [],
  intervals: [],
  systemConfig: {},
  jobQueue: {
    experiment: [],
  },
});

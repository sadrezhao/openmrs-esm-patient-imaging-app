import { useCallback, useMemo } from 'react';
import useSWR, {mutate} from 'swr';
import { FetchResponse, Patient,} from '@openmrs/esm-framework';
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import type { DicomStudy, OrthancConfiguration, RequestProcedure, RequestProcedureStep, Series } from '../types';
import { testSeries, testStudy, testRequestProcedure, testInstances, testProcedureSteps, testConfigurations, testMrsPatient} from '../api/api-test';

export const careSettingUuid = 'b47d1b48-1d9f-4d3c-b44b-8f29a9b20c7d';

// export interface PatientStudiesFetchResponse {
//   results: Array<DicomStudy>
// }

export default interface PatientStudiesResponse {
  results: Array<DicomStudy>;
  id: string;
  total: number;
  type: string;
}

export interface RequestProcedureResponse {
  results: Array<RequestProcedure>;
  id: string;
  total: number;
  type: string;
}

export interface ProcedureStepResponse {
  results: Array<RequestProcedureStep>;
  id: string;
  total: number;
  type: string;
}

export interface SeriesResponse {
  results: Array<Series>;
  id: string;
  total: number;
  type: string;
}

export interface OrthancConfigurationResponse {
  results: Array<OrthancConfiguration>
  id: string;
  total: number;
  type: string;
}

export interface MappingStudyResponse {
  results: DicomStudy,
  id: string;
  total: number;
  type: string
}



function sortRequestsByDate(requests: any[]) {
  return requests?.sort(
    (request1, request2) => new Date(request2.createdDate).getTime() - new Date(request2.createDate).getTime(),
  );
}


export function useStudies(patientUuid: string) {
    // const studiesUrl = `${restBaseUrl}/studies?patient=${patientId}`;
    const studiesUrl = `http://localhost:8042/studies/49974143-ec23cb52-6b2a1c46-14d5daa0-0822ce1a`
    
    const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: PatientStudiesResponse}, Error>(
        studiesUrl,
        openmrsFetch,
    );

    return {
        data: testStudy ?  testStudy : null,
        error: error,
        isLoading,
        isValidating,
        mutate,
    };
}


export async function uploadFiles(
  files: File[], 
  config: OrthancConfiguration,
  abortController: AbortController,
) {
  const uploadUrl = `${config.orthancBaseUrl}/instaces`; //"POST"

  const formData = new FormData;
  files.forEach(file => formData.append('file', file));

  const uploadResponse = await openmrsFetch(`${uploadUrl}`, {
    method: 'POST',
    signal: abortController.signal,
    body: formData,
  });
  return uploadResponse;
}

export async function useSynchronizeStudies (
  fetchOption: String,
  server: String,
  abortController: AbortController,
){
  // const synchronizeUrl = `` //get

    // const mutateRequest = useCallback(
  //   () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/worklist?patient=${patientUuid}`)),
  //   [patientUuid],
  // );

  // const { data, error, isLoading, isValidating } = useSWR<FetchResponse<PatientStudiesResponse>, Error>(
  //   synchronizeUrl,
  //   openmrsFetch,
  // );

  return {
    data: testStudy ? testStudy : null,
    error: null,
    isLoading: null,
    isValidating: null,
    // mutate: mutateRequest,
    mutate: null,
  };

}

export function useRequests(patientUuid: string) {
  // const requestsUrl = `${restBaseUrl}/worklist?patient=${patientId}`
  const requestsUrl = `http://localhost:8042/studies/49974143-ec23cb52-6b2a1c46-14d5daa0-0822ce1a`
  
  // const mutateRequest = useCallback(
  //   () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/worklist?patient=${patientUuid}`)),
  //   [patientUuid],
  // );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<RequestProcedureResponse>, Error>(
    patientUuid ? requestsUrl : null,
    openmrsFetch,
  );

  // const requests = useMemo(() => sortRequestsByDate(data?.data?.results) ?? null, [data]);

  return {
    data: testRequestProcedure ? testRequestProcedure : null,
    error,
    isLoading,
    isValidating,
    // mutate: mutateRequest,
    mutate: null,
  };

}


export function useProcedureStep(request: RequestProcedure) {
  const procedureStepUrl = `http://localhost:8042/series/49974143-ec23cb52-6b2a1c46-14d5daa0-0822ce1a/instances`

  const mutateInstances = useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/worklist`)),
    [request],
  );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<ProcedureStepResponse>, Error>(
    request? procedureStepUrl : null,
    openmrsFetch,
  );

  return {
    data: testProcedureSteps ? testProcedureSteps : null,
    error,
    isLoading,
    isValidating,
    mutate: mutateInstances,
  };

}

export function useStudySeries(study: DicomStudy) {
  const requestsUrl = `http://localhost:8042/study/49974143-ec23cb52-6b2a1c46-14d5daa0-0822ce1a/series`

  const mutateSeries = useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/study=${study.studyInstanceUID}/series`)),
    [study],
  );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<SeriesResponse>, Error>(
    study? requestsUrl : null,
    openmrsFetch,
  );

  return {
    data: testSeries ? testSeries : null,
    error,
    isLoading,
    isValidating,
    mutate: mutateSeries,
  };
}


export function useStudyInstances(series: Series) {
  const instancesUrl = `http://localhost:8042/series/49974143-ec23cb52-6b2a1c46-14d5daa0-0822ce1a/instances`

  // const mutateInstances = useCallback(
  //   () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/series=${series.orthancSeriesUID}/instnace`)),
  //   [series],
  // );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<SeriesResponse>, Error>(
    series? instancesUrl : null,
    openmrsFetch,
  );

  return {
    data: testInstances ? testInstances : null,
    error,
    isLoading,
    isValidating,
    mutate: null,
  };
}

export function useOrthancConfigurations() {
  const configurationUrl = `${restBaseUrl}/configurations`

  const mutateInstances = useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/configurations`)),
    [],
  );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<OrthancConfigurationResponse>, Error>(
    configurationUrl,
    openmrsFetch,
  );

  return {
    // data: data ?? null,
    data: testConfigurations ?? null,
    error: null,
    isLoading: null,
    isValidating: null,
    // mutate: mutateInstances,
    mutate: null,
  };
}

export function useMappingStudy(study: DicomStudy, patientUuid: string) {

  const newStudy = study;
  newStudy.patientUuid = patientUuid;

  const mappingUrl = `${restBaseUrl}/mapping/?study=${study}`

  const mutateInstances = useCallback(
    () => mutate((key) => typeof key === 'string' && key.startsWith(`${restBaseUrl}/mapping/?study=${study}`)),
    [],
  );

  const { data, error, isLoading, isValidating } = useSWR<FetchResponse<MappingStudyResponse>, Error>(
    mappingUrl,
    openmrsFetch,
  );

  return {
    // data: data ?? null,
    data: testStudy ?? null,
    error: null,
    isLoading: null,
    isValidating: null,
    // mutate: mutateInstances,
    mutate: null,
  };
}




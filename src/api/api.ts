import React, { useCallback } from 'react';
import useSWR, {mutate} from 'swr';
import { FetchResponse, } from '@openmrs/esm-framework';
import { openmrsFetch } from '@openmrs/esm-framework';
import type { DicomStudy, Instance, OrthancConfiguration, RequestProcedure, RequestProcedureStep, Series, StudiesWithScores } from '../types';
import { testSeries, testStudy, testRequestProcedureList, testInstances, testProcedureSteps, testConfigurations, testRequestProcedure } from '../api/api-test';
import { imagingUrl, worklistUrl } from '../imaging/constants'


export function getStudiesByPatient(patientUuid: string) {
    const studiesUrl = `${imagingUrl}/studies?patient=${patientUuid}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR<{data: Array<DicomStudy>}, Error>(
      studiesUrl,
      openmrsFetch,
    );

    return {
        data: data?.data,
        error: error,
        isLoading: isLoading,
        isValidating: isValidating,
        mutate,
    };
}


export function getStudiesByConfig(configuration: OrthancConfiguration, patientUuid: string) {
  const studiesByConfigUrl = `${imagingUrl}/studiesbyconfig?configurationId=${configuration.id}&patient=${patientUuid}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<FetchResponse<StudiesWithScores>, Error>(
    studiesByConfigUrl,
    openmrsFetch,
  );

  return {
      data: data?.data,
      error: error,
      isLoading: isLoading,
      isValidating: isValidating,
      mutate,
  };
}

export function getOrthancConfigurations() {
  const configurationUrl = `${imagingUrl}/configurations`

  const { data, error, isLoading, isValidating, mutate} = useSWR<FetchResponse<Array<OrthancConfiguration>>, Error>(
    configurationUrl,
    openmrsFetch,
  );

  if (error) {
    console.error("SWR error fetching Orthanc configurations:", error);
  }

  return {
    data: data?.data,
    error,
    isLoading,
    isValidating,
    mutate: mutate,
  };
}

export async function uploadStudies (
  files: File[], 
  configuration: OrthancConfiguration,
  abortController: AbortController,
) {

  const uploadUrl = imagingUrl+"/instances"

  for (const file of files) {
    const formData = new FormData()
    formData.append("configurationId", configuration.id.toString())
    formData.append("file", file)

    const response = await openmrsFetch(uploadUrl, {
      method: 'POST',
      signal: abortController.signal,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await response.text() || "Upload failed")
    }
  }
}

export async function getLinkStudies (
  fetchOption: string,
  configuration: OrthancConfiguration,
  abortController: AbortController
){
  const linkUrl = `${imagingUrl}/linkstudies`

  const formData = new FormData()
  formData.append("configurationId", configuration.id.toString())
  formData.append("fetchOption", fetchOption) 

  const response = await openmrsFetch(linkUrl, {
    method: 'POST',
    signal: abortController.signal,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await response.text() || "Link studies failed")
  }
}

export function getRequestsByPatient(patientUuid: string) {
  const requestsUrl = `${worklistUrl}/patientrequests?patient=${patientUuid}`
  
  const { data, error, isLoading, isValidating, mutate} = useSWR<FetchResponse<Array<RequestProcedure>>, Error>(
    patientUuid ? requestsUrl : null,
    openmrsFetch,
  );

  return {
    data: data?.data,
    error: error,
    isLoading: isLoading,
    isValidating: isValidating,
    mutate:mutate,
  };
}


export function getProcedureStep(request: RequestProcedure) {

  const procedureStepUrl = `${worklistUrl}/requeststep?&requestId=${request.id}`

  const { data, error, isLoading, isValidating, mutate} = useSWR<FetchResponse<Array<RequestProcedureStep>>, Error>(
    procedureStepUrl,
    openmrsFetch,
  );

  return {
    data: data?.data,
    error: error,
    isLoading: isLoading,
    isValidating: isValidating,
    mutate: mutate,
  };

}

export function getStudySeries(studyId: number) {

  const seriesUrl = `${imagingUrl}/studyseries?studyId=${studyId}`

  const { data, error, isLoading, isValidating, mutate} = useSWR<FetchResponse<Array<Series>>, Error>(
    seriesUrl,
    openmrsFetch,
  );

  return {
    data: data?.data,
    error,
    isLoading,
    isValidating,
    mutate: mutate,
  };
}


export function getStudyInstances(studyId: number, seriesInstanceUID: string) {
  const instancesUrl = `${imagingUrl}/studyinstances?studyId=${studyId}&seriesInstanceUID=${seriesInstanceUID}`

  const { data, error, isLoading, isValidating, mutate} = useSWR<FetchResponse<Array<Instance>>, Error>(
    instancesUrl,
    openmrsFetch,
  );

  return {
    data: data?.data,
    error,
    isLoading,
    isValidating,
    mutate: mutate,
  };
}

export async function assignStudy(
    studyId: number, 
    patientUuid: string, 
    isAssign: boolean,
    abortController: AbortController
  ) {
    const mappingUrl = `${imagingUrl}/assingstudy`

    const formData = new FormData()
    formData.append("studyId", studyId.toString())
    formData.append("patient", patientUuid)
    formData.append("isAssign", isAssign.toString())

    const response = await openmrsFetch(mappingUrl, {
      method: 'POST',
      signal: abortController.signal,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(await response.text() || "Save patient request procedure failed")
    }
}

export async function saveRequestProcedure(
    request: RequestProcedure, 
    patientUuid: string,
    abortController: AbortController
  ){
    const saveRequstUrl = `${worklistUrl}/saverequest`;

    const formData = new FormData()
    formData.append("patient", patientUuid)
    formData.append("requestProcedure", JSON.stringify(request))


    const response = await openmrsFetch(saveRequstUrl,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text() || "Save patient request procedure failed")
    }
}


export async function saveRequestProcedureStep (
  step: RequestProcedureStep,
  requestId: number,
  abortController: AbortController
) {
  const saveProcedureStepUrl = `${worklistUrl}/savestep`;

  const formData = new FormData()
  formData.append("requestId", requestId.toString())
  formData.append("step", JSON.stringify(step))

  const response = await openmrsFetch(saveProcedureStepUrl,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: formData
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Save patient request procedure step failed")
  }
}

export function deleteStudy(studyId: string) {
  return openmrsFetch(`${imagingUrl}/study?studyId=${studyId}`,{
    method: 'DELETE',
  })
}

export function deleteSeries(seriesInstanceUID: string) {
  return openmrsFetch(`${imagingUrl}/series?seriesInstanceUID=${seriesInstanceUID}`, {
    method: 'DELETE',
  })
}

export function deleteRequest(requestId: string) {
  return openmrsFetch(`${worklistUrl}/request?requestId=${requestId}`, {
    method: 'DELETE',
  })
}

export function deleteProcedureStep(stepId: string) {
  return openmrsFetch(`${worklistUrl}/procedureStep?stepId=${stepId}`, {
    method: 'DELETE',
  })
}

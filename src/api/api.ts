import useSWR from 'swr';
import { FetchResponse, } from '@openmrs/esm-framework';
import { openmrsFetch } from '@openmrs/esm-framework';
import type { CreateRequestProcedure, CreateRequestProcedureStep, DicomStudy, Instance, OrthancConfiguration, RequestProcedure, RequestProcedureStep, Series, StudiesWithScores } from '../types';
import { imagingUrl, worklistUrl } from '../imaging/constants'

/**
 * 
 * @param patientUuid 
 * @returns 
 */
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

/**
 * 
 * @param configuration 
 * @param patientUuid 
 * @returns 
 */
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

/**
 * 
 * @returns 
 */
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

/**
 * 
 * @param files 
 * @param configuration 
 * @param abortController 
 */
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

/**
 * 
 * @param fetchOption 
 * @param configuration 
 * @param abortController 
 */
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

/**
 * 
 * @param patientUuid 
 * @returns 
 */
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

/**
 * 
 * @param requestId 
 * @returns 
 */
export function getProcedureStep(requestId: number) {

  const procedureStepUrl = `${worklistUrl}/requeststep?&requestId=${requestId}`

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

/**
 * 
 * @param studyId 
 * @returns 
 */
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

/**
 * 
 * @param studyId 
 * @param seriesInstanceUID 
 * @returns 
 */
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

/**
 * 
 * @param studyId 
 * @param patientUuid 
 * @param isAssign 
 * @param abortController 
 */
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

/**
 * 
 * @param request 
 * @param patientUuid 
 * @param abortController 
 */
export async function saveRequestProcedure(
    request: CreateRequestProcedure, 
    patientUuid: string,
    abortController: AbortController
  ){
    const saveRequstUrl = `${worklistUrl}/saverequest`;

    const requestPostData = {
      configurationId: request.orthancConfiguration.id,
      patientUuid: patientUuid,
      accessionNumber: request.accessionNumber,
      requestingPhysician: request.requestingPhysician,
      requestDescription: request.requestDescription,
      priority: request.priority
    };

    const response = await openmrsFetch(saveRequstUrl,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: abortController.signal,
      body: JSON.stringify(requestPostData)
    });

    if (!response.ok) {
      throw new Error(await response.text() || "Save patient request procedure failed")
    }
}

/**
 * 
 * @param step 
 * @param requestId 
 * @param abortController 
 */
export async function saveRequestProcedureStep (
  step: CreateRequestProcedureStep,
  requestId: number,
  abortController: AbortController
) {
  const saveProcedureStepUrl = `${worklistUrl}/savestep`;

  const stepPostData = {
    requestId: requestId,
    modality: step.modality,
    aetTitle: step.aetTitle,
    scheduledReferringPhysician: step.scheduledReferringPhysician,
    requestedProcedureDescription: step.requestedProcedureDescription,
    stepStartDate: step.stepStartDate,
    stepStartTime: step.stepStartTime,
    stationName: step.stationName,
    procedureStepLocation: step.procedureStepLocation
  }

  const response = await openmrsFetch(saveProcedureStepUrl,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: abortController.signal,
    body: JSON.stringify(stepPostData)
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Save patient request procedure step failed")
  }
}

/**
 * 
 * @param studyId 
 * @param deleteOption 
 * @param abortController 
 * @returns 
 */
export function deleteStudy(studyId: number, deleteOption: string, abortController: AbortController) {
  return openmrsFetch(`${imagingUrl}/study?studyId=${studyId}&deleteOption=${deleteOption}`,{
    method: 'DELETE',
    signal: abortController.signal
  })
}

/**
 * 
 * @param orthancSeriesUID 
 * @param studyId 
 * @param abortController 
 * @returns 
 */
export function deleteSeries(orthancSeriesUID: string, studyId: number, abortController: AbortController) {
  return openmrsFetch(`${imagingUrl}/series?orthancSeriesUID=${orthancSeriesUID}&studyId=${studyId}`, {
    method: 'DELETE',
    signal: abortController.signal
  })
}

/**
 * 
 * @param requestId 
 * @param abortController 
 * @returns 
 */
export function deleteRequest(requestId: number, abortController: AbortController) {
  return openmrsFetch(`${worklistUrl}/request?requestId=${requestId}`, {
    method: 'DELETE',
    signal: abortController.signal
  })
}

/**
 * 
 * @param stepId 
 * @param abortController 
 * @returns 
 */
export function deleteProcedureStep(stepId: number, abortController: AbortController) {
  return openmrsFetch(`${worklistUrl}/requeststep?stepId=${stepId}`, {
    method: 'DELETE',
    signal: abortController.signal
  })
}

/**
 * 
 * @param orthancInstanceUID 
 * @param studyId 
 * @param abortController 
 * @returns 
 */
export function previewInstance(orthancInstanceUID: string, studyId: number, abortController: AbortController) {
   const previewUrl = `${imagingUrl}/previewinstance?orthancInstanceUID=${orthancInstanceUID}&studyId=${studyId}`
   return openmrsFetch(previewUrl, {
    method: 'GET',
    signal: abortController.signal
   })
}
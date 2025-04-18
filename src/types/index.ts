import { Patient } from "@openmrs/esm-framework";

export interface DicomStudy {
  id?: number,
  studyInstanceUID: string;
  orthancStudyUID: string;
  orthancConfiguration: OrthancConfiguration;
  patientName: string;
  patientUuid: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  gender: string;
}

export interface Series {
  id?: number;
  seriesInstanceUID: string;
  orthancSeriesUID: string;
  orthancConfiguration: OrthancConfiguration;
  seriesDescription: string;
  seriesNumber: string;
  seriesDate: string;
  seriesTime: string;
  modality: string;
}

export interface OrthancConfiguration {
  id?: number;
  orthancBaseUrl: string;
  orthancProxyUrl?: string;
  lastChangedIndex: number;
}

export interface Instance {
  id?: number,
  sopInstanceUID: string;
  orthancInstanceUID: string;
  instanceNumber: string;
  imagePositionPatient: string;
  numberOfFrames: string;
  orthancConfiguration: OrthancConfiguration,
}

export interface RequestProcedure {
  id?: number,
  status: string,
  orthancConfiguration: OrthancConfiguration,
  patientUuid: string,
  accessionNumber: string,
  studyInstanceUID?: string,
  requestingPhysician: string,
  requestDescription: string,
  priority: string
}

export interface RequestProcedureStep {
  id?: number,
  requestProcedure: RequestProcedure,
  modality: string,
  aetTitle: string,
  scheduledReferringPhysician: string,
  requestedProcedureDescription: string,
  stepStartDate: string,
  stepStartTime: string,
  performedProcedureStepStatus: string,
  stationName?: string,
  procedureStepLocation?: string
}

export enum RequestProcedureStatus {
  SCHEDULED = 'scheduled',
  PROGRESS = 'progress',
  COMPLETED = 'completed',
}

export enum StudyStatus {
  REGISTERED = 'registered',
  AVAILABLE = 'available',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
  INACTIVE = 'inactive'
}
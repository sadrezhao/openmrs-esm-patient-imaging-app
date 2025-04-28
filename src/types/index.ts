
export interface DicomStudy {
  id: number,
  studyInstanceUID: string;
  orthancStudyUID: string;
  orthancConfiguration: OrthancConfiguration;
  patientName: string;
  mrsPatientUuid: string;
  studyDate: string;
  studyDescription: string;
  gender?: string;
}

export interface Series {
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
  id: number;
  orthancBaseUrl: string;
  orthancProxyUrl?: string;
}

export interface Instance {
  sopInstanceUID: string;
  orthancInstanceUID: string;
  instanceNumber: string;
  imagePositionPatient: string;
  numberOfFrames: string;
  orthancConfiguration: OrthancConfiguration,
}

export interface RequestProcedure {
  id: number,
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
  id: number,
  // requestProcedure: RequestProcedure,
  requestId: number,
  modality: string,
  aetTitle: string,
  scheduledReferringPhysician: string,
  requestedProcedureDescription: string,
  stepStartDate: Date,
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

export const modalityOptions = [
  "CR (Computed Radiography)",
  "CT (Computed Tomography)",
  "MR (Magnetic Resonance Imaging)",
  "US (Ultrasound)",
  "XA (X-ray Angiography)",
  "DX (Digital Radiography)",
  "MG (Mammography)",
  "NM (Nuclear Medicine)",
  "PT (Positron Emission Tomography)",
  "RF (Radio Fluoroscopy)",
  "SC (Secondary Capture)",
  "XC (External-camera Photography)",
  "OP (Ophthalmic Photography)",
  "PR (Presentation State)",
  "SR (Structured Report)",
  "RT (Radiotherapy)"
]

export interface StudiesWithScores {
  studies: Array<DicomStudy>;
  scores: Map<string, number>;
}

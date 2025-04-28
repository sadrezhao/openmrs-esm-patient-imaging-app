import { type Page } from '@playwright/test';

export class ImagingPage {
  constructor(readonly page: Page) {}
  
  async goto(patientUuid: string) {
    await this.page.goto(`/openmrs/spa/patient/${patientUuid}/chart/imaging`);
  }
}

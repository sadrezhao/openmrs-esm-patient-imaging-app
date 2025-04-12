import { Page } from '@playwright/test';

export class ImagingPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto(`imaging`);
  }
}

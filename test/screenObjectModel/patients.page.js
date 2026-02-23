import searchPatientPage from "./searchPatient.page";
import {
  verifyAndClick,
  waitForElement,
} from "/Users/nagasubarayudu/Desktop/IOS/helpers/helper.js";

class PatientsPage {
  get patients() {
    return $('//XCUIElementTypeStaticText[@name="Patients"]');
  }
  get draft() {
    return $('(//XCUIElementTypeStaticText[@name="Draft Transcript"])[1]');
  }

  get patientSearch() {
    return $("~Search Patients");
  }
  get nokiDashboard() {
    return $("~noki dashboard");
  }
  get addPatient() {
    return $('//XCUIElementTypeButton[@name="Add Patient"]');
  }
  get clear() {
    return $("~Clear text");
  }
  get cancel() {
    return $('//XCUIElementTypeButton[@name="Cancel"]');
  }
  get noPatitentFound() {
    return $("~No Patient Found");
  }
  get goBack() {
    return $("~Left");
  }
  get startNewEncounter() {
    return $('//XCUIElementTypeButton[@name="Start New Encounter"]');
  }
  get firstEncounter() {
    return $("~rightArrow");
  }
  get firstEncounterForExistingPatient() {
    return $(
      '-ios class chain:**/XCUIElementTypeImage[`name == "rightArrow"`][1]',
    );
  }

  get keyBoardSearch() {
    return $("~Search");
  }
  async Search(patientName) {
    await this.patientSearch.click();
    await this.patientSearch.setValue(patientName);
  }
  async patientElement(patientName) {
    const name = await $(`~${patientName}`);

    const singleCell = await $(
      `-ios class chain:**/XCUIElementTypeTable/XCUIElementTypeCell[1]`,
    );

    const multiCell = await $(
      `-ios class chain:**/XCUIElementTypeTable/XCUIElementTypeCell`,
    );

    if (await name.isDisplayed()) {
      await name.click();
    } else if (await singleCell.isDisplayed()) {
      await singleCell.click();
    } else if (await multiCell.isDisplayed()) {
      await multiCell.click();
    } else {
      console.log("No visible patient element found");
    }
  }
  async patientSearchAndContinue(patientName) {
    await this.Search(patientName);
    await driver.pause(2000);
    const patientElement = await searchPatientPage.patientName(patientName);
    await verifyAndClick(patientElement);
  }

  async encounterSelection() {
    if (await this.firstEncounter.isDisplayed()) {
      await this.firstEncounter.click();
    } else {
      await this.firstEncounterForExistingPatient.click();
    }
  }
}

export default new PatientsPage();

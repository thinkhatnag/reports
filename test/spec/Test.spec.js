import EncounterPage from "../screenObjectModel/encounter.page.js";
import RecordingPage from "../screenObjectModel/recording.page.js";
import SpanishLanguage from "../screenObjectModel/spanishLanguage.js";
describe("Test Suite", () => {

  it("Test Case - Note Search", async () => {
  await this.PatientSearchTextField.click();
    await this.PatientSearchTextField.setValue(patientName);
    await this.SearchBtn.click()
  
  });
});

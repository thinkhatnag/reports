import EncounterPage from "../screenObjectModel/encounter.page.js";
import PatientsPage from "../screenObjectModel/patients.page.js";
import RecordingPage from "../screenObjectModel/recording.page.js";
import SpanishLanguage from "../screenObjectModel/spanishLanguage.js";
describe("Test Suite", () => {
it("Test Case - Note Search", async function () {
  await PatientsPage.Search("Naga");
    
       const patientElement =await $(`//XCUIElementTypeStaticText[@name="Naga"]`,
       );
        await patientElement.click()
     
})
})

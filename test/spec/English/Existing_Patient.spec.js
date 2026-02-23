import HomePage from "../../screenObjectModel/home.page.js";
import PatientsPage from "../../screenObjectModel/patients.page.js";
import EncounterPage from "../../screenObjectModel/encounter.page.js";
import SearchPatientPage from "../../screenObjectModel/searchPatient.page.js";
import RecordingPage from "../../screenObjectModel/recording.page.js";
// import AddPatitentPage from '../../screenObjectModel/addPatient.page.js';
import LoginPage from "../../screenObjectModel/login.page.js";
import {
  verify,
  verifyAndClick,
  waitForElement,
  aeroplaneModeOff,
  aeroplaneModeOn,
  validate,
  aeroplanemodeswipe,
} from "../../../helpers/helper.js";
import allureReporter from "@wdio/allure-reporter";
import AudioManeger from "../../screenObjectModel/audioManeger.js";
import QuickActions from "../../screenObjectModel/quickActions.page.js";
import SettingPage from "../../screenObjectModel/setting.page.js";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
beforeEach(() => {
  allureReporter.addSubSuite("New Encounter E2E Flow");
});
it("New Encounter Creation", async () => {
  await LoginPage.restartApp();
  await driver.pause(3000);
  await SearchPatientPage.startNewConversation("Naga");
});

it("Automatic Sync Verification (Offline to Online and Vice Versa)", async () => {
  await AudioManeger.playAudio("english");
  console.log("Audio started:", AudioManeger.currentAudioFile);
  await RecordingPage.recordAudioforOfflineModeMT();
  await driver.pause(10000);
  await verifyAndClick(RecordingPage.pauseBtn);
  await AudioManeger.pauseAudio();
  console.log("Audio paused at:", AudioManeger.pausedTime, "seconds");
  await driver.pause(5000);
  await RecordingPage.playBtn.click();
});
it("App Killed and Reopened (Offline Mode Verification)", async () => {
  await AudioManeger.resumeAudio(); //correct
  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(30000);
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await aeroplaneModeOn(); //offline
  await driver.pause(5000);
  await AudioManeger.pauseAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(3000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(RecordingPage.ContinueBtn);
  await verifyAndClick(RecordingPage.ContinueBtn);
});

it("App Killed in Offline and Reopened in Online Mode Verification", async () => {
  await AudioManeger.resumeAudio(); //correct
  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(30000); //again playing audio for 1 min in online
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await aeroplanemodeswipe(); // online
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(RecordingPage.ContinueBtn);
  await RecordingPage.ContinueBtn.click();
});
it("Offline Mode Stop and App Kill Verification", async () => {
  await aeroplanemodeswipe(); //offline
  await AudioManeger.resumeAudio();
  await driver.pause(30000);
  await AudioManeger.stopAudio();
  await verifyAndClick(RecordingPage.stopBtn);
  await driver.pause(5000);
  await verify(RecordingPage.offlineConversationSaved);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await verify(RecordingPage.offlineConversationSaved);
  await driver.pause(5000);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await aeroplanemodeswipe(); // online
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await waitForElement(RecordingPage.PrevEncounterRefNo);
  await verify(RecordingPage.PrevEncounterRefYes);
  await verifyAndClick(RecordingPage.PrevEncounterRefNo);
});
it("SOAP Note Generation For New Encounter", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch {
    allureReporter.addIssue("Soap note is not generated Even after long time ");
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
    if (await QuickActions.quickActionButton.isDisplayed()) {
      allureReporter.addIssue(
        "Soap note is not generated Even after long time but whwn we kill the app and re open the same patient encouter the soap note is generated in background",
      );
    }
  }

  await RecordingPage.SOAPNote_Verification();
});
it("Transcript Verification for the First Conversation", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});
it("Second Conversation for the New Encounter", async () => {
  await verifyAndClick(RecordingPage.SoapNoteBtn);
  if (
    await RecordingPage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureReporter.addIssue(
      `the soap note is  genrated instead of showing 'Add Conversation' Button it is showing 'resumeConvesation'`,
    );
    await RecordingPage.resumeConversationForMultipleConverstionScenario.click();
    await RecordingPage.resumeConversationForMultipleConverstionScenarioYes.click();
  } else if (await RecordingPage.AddConversation.isDisplayed()) {
    await verifyAndClick(RecordingPage.AddConversation);
    await verifyAndClick(RecordingPage.AddConversationConfirmationYes);
  }
  await AudioManeger.playAudio("english");
  await driver.pause(5000);

  await aeroplaneModeOn(); //offline
  await driver.pause(80000);
  await AudioManeger.stopAudio();
  await driver.terminateApp(process.env.BUNDLE_ID); //app killed
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await aeroplanemodeswipe(); //online
  await driver.pause(5000);
  await waitForElement(RecordingPage.ContinueBtn);
  await verifyAndClick(RecordingPage.endEncounter);
  await driver.pause(5000);
  if (await RecordingPage.stopBtn.isDisplayed()) {
    await verifyAndClick(RecordingPage.stopBtn);
    await verifyAndClick(RecordingPage.PrevEncounterRefYes);
    allureReporter.addIssue(
      "Here even after clicking End Encouter, soap note generation is not Intiated",
    );
  } else {
    console.log("issue related to api is resolved");
  }
  await waitForElement(RecordingPage.PrevEncounterRef);
  await RecordingPage.PrevEncounterRefYes.click();
});
it("SOAP Note generation for the Second Conversation", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch {
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
  }
  if (await RecordingPage.AddConversation.isDisplayed()) {
    allureReporter.addIssue(
      "Soap note is not generated Even after long time when we restart the app and open same patient soap note is generated in background",
    );
  } else if (
    await RecordingPage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureReporter.addIssue(
      `The soap note is  genrated instead of showing 'Add Conversation' Button it is showing 'resumeConvesation' is saved as Draft`,
    );
  }
  await RecordingPage.SOAPNote_Verification();
});
it("Transcript Verification for the Second Conversation", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});
it("Third Conversation (Draft Creation and Completion of Draft Transcript)", async () => {
  await verifyAndClick(RecordingPage.SoapNoteBtn);
  await RecordingPage.third_Conversation_For_Existing_Patient();
});
it("SOAP Note Generation for the Draft Conversation", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch (error) {
    if (await QuickActions.quickActionButton.isDisplayed()) {
      await RecordingPage.SOAPNote_Verification();
    } else {
      allureReporter.addIssue(
        "Quick Action Button is not displayed even after long wait waiting",
      );
      await driver.terminateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await driver.activateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await HomePage.patients.click();
      await PatientsPage.patientSearchAndContinue("Naga");
      await PatientsPage.encounterSelection();
      await driver.pause(5000);
    }
  }
  await RecordingPage.SOAPNote_Verification();
});

it("Transcript Verification for the Draft Conversation", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});

it("ICD-CPT codes Generation and Regeneration", async () => {
  await QuickActions.ICD_CPT();
});
it("Care plan Generation and Regeneration", async () => {
  await QuickActions.care_Plan();
});
it("Feedback Generation and Regeneration", async () => {
  await QuickActions.feed_back();
});
it("Referal Generation and Regeneration", async () => {
  await QuickActions.referal_Letter();
});
it("SoapNote Regeneration", async () => {
  await QuickActions.SOAPNote();
});
it("Patient Info Update", async () => {
  await RecordingPage.UpdatePatientInfo();
});
it("Patient info manual update", async () => {
  await RecordingPage.manualUpdate();
});
it("HayNoki verification", async () => {
  await RecordingPage.hayNoki();
});

it("Finalize Encounter", async () => {
  await RecordingPage.finalize_Encounter();
});
it("Logout", async () => {
  await LoginPage.restartApp();
  await waitForElement(HomePage.startNewEncounterButton);
  await verifyAndClick(HomePage.settings);
  await verifyAndClick(SettingPage.launguage);
  await verifyAndClick(SettingPage.spanish);
  await verifyAndClick(SpanishLanguage.logoutBtn);
  await verifyAndClick(SpanishLanguage.logoutConformationBtn);
  await verify(SpanishLanguage.loginButton);
});

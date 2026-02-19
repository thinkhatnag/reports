import {
  verify,
  verifyAndClick,
  waitForElement,
  aeroplaneModeOn,
  aeroplanemodeswipe,
} from "../../../helpers/helper.js";
import allureReporter from "@wdio/allure-reporter";
import AudioManeger from "../../screenObjectModel/audioManeger.js";
import LoginPage from "../../screenObjectModel/login.page.js";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
import RecordingPage from "../../screenObjectModel/recording.page.js";
import PatientsPage from "../../screenObjectModel/patients.page.js";
import HomePage from "../../screenObjectModel/home.page.js";
import quickActionsPage from "../../screenObjectModel/quickActions.page.js";
beforeEach(() => {
  allureReporter.addSubSuite("First Encounter E2E Flow -Es");
});
const shared = { createdPatient: null };

it("Patient Creation -Es", async () => {
  await LoginPage.restartApp();
  await waitForElement(SpanishLanguage.startNewEncounter);
  await SpanishLanguage.startNewEncounter.click();
  await driver.pause(2000);
  await verifyAndClick(SpanishLanguage.addPatient);
  await driver.pause(2000);
  await SpanishLanguage.addPatitentWrn();
  shared.createdPatient = await SpanishLanguage.createNewPatient();
});
it("Automatic Sync Verification (Offline to Online and Vice Versa) for the First Encounter -Es", async () => {
  await driver.pause(2000);
  await SpanishLanguage.startConversation();
  await AudioManeger.playAudio("spanish");
  console.log("Audio started:", AudioManeger.currentAudioFile);
  await SpanishLanguage.recordAudioforOfflineModeMT();
  await driver.pause(2000);
  await SpanishLanguage.pauseBtn.click();
  await AudioManeger.pauseAudio();
  console.log("Audio paused at:", AudioManeger.pausedTime, "seconds");
  await driver.pause(5000);
});
it("App Killed and Reopened (Offline Mode Verification) for the First Encounter -Es", async () => {
  await AudioManeger.resumeAudio();
  if (await SpanishLanguage.PlayBtn) {
    await SpanishLanguage.PlayBtn.click();
  } else {
    console.log("issue resolved");
  }

  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(30000);
  await AudioManeger.pauseAudio();
  await driver.pause(5000);
  await aeroplaneModeOn(); //. offline
  await driver.pause(5000);
  await AudioManeger.pauseAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(2000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(SpanishLanguage.RecordingContinueBtn);
  await verifyAndClick(SpanishLanguage.RecordingContinueBtn);
});
it("App Killed in Offline and Reopened in Online Mode Verification for the First Encounter -Es", async () => {
  await AudioManeger.resumeAudio(); //correct
  if (await SpanishLanguage.PlayBtn) {
    await SpanishLanguage.PlayBtn.click();
  } else {
    console.log("issue resolved");
  }
  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(30000); //again playing audio for 1 min in online
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await aeroplanemodeswipe(); // online
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(SpanishLanguage.RecordingContinueBtn);
  await verifyAndClick(SpanishLanguage.RecordingContinueBtn);
});
it("Offline Mode Stop and App Kill Verification for the First Encounter -Es", async () => {
  await aeroplanemodeswipe(); //offlline
  await AudioManeger.resumeAudio();
  if (await SpanishLanguage.PlayBtn) {
    await SpanishLanguage.PlayBtn.click();
  } else {
    console.log("issue resolved");
  }
  await driver.pause(30000);
  await AudioManeger.stopAudio();
  await verifyAndClick(RecordingPage.stopBtn);
  await driver.pause(5000);
  await verify(SpanishLanguage.offlineConversationSaved);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await verify(SpanishLanguage.offlineConversationSaved);
  await driver.pause(5000);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await aeroplanemodeswipe(); // online
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
});
it("SOAP Note Generation for the First Encounter -Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch {
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await SpanishLanguage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
    if (await SpanishLanguage.quickActionButton.isDisplayed()) {
      allureReporter.addIssue(
        "Soap note is not generated Even after long time but whwn we kill the app and re open the same patient encouter the soap note is generated in background",
      );
    }
  }

  await SpanishLanguage.SOAPNOTE_Verification();
});
it("Transcript verification for the first Encounter -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await SpanishLanguage.Transcript_Verification();
});
it("Second Conversation for the First Encounter -Es", async () => {
  await verifyAndClick(SpanishLanguage.SoapNoteBtn);
  if (
    await SpanishLanguage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureRepoter.addIssue(
      `The soap note is  genrated instead of showing 'Add Conversation' Button it is showing 'resumeConvesation' is saved as Draft`,
    );
    await SpanishLanguage.resumeConversationForMultipleConverstionScenario.click();
    await SpanishLanguage.resumeConversationForMultipleConverstionScenarioYes.click();
  } else if (await SpanishLanguage.AddConversation.isDisplayed()) {
    await verifyAndClick(SpanishLanguage.AddConversation);
    await verifyAndClick(SpanishLanguage.AddConversationConfirmationYes);
  }
  await AudioManeger.playAudio("spanish");
  await driver.pause(5000);
  await aeroplaneModeOn(); //offline
  await driver.pause(80000);
  await AudioManeger.stopAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await aeroplanemodeswipe(); //online
  await driver.pause(5000);
  await waitForElement(SpanishLanguage.endEncounter);
  await verifyAndClick(SpanishLanguage.endEncounter);
  await driver.pause(5000);
  if (await SpanishLanguage.PrevEncounterRef.isDisplayed()) {
    await SpanishLanguage.PrevEncounterRefNo.click();
    allureReporter.addIssue(
      "For the First encounter it is showing the poup of previous encounter reference",
    );
  } else {
    console.log(
      "issue related to previous Encounter reference pop up got resolved",
    );
  }
});

it("SOAP Note Verification for the Second Conversation for the First Encounter -Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch {
    allureReporter.addIssue("Soap note is not generated Even after long time");
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await driver.pause(2000);
    await SpanishLanguage.patientSearchAndContinue(shared.createdPatient);
    await driver.pause(2000);
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
  }
  if (await SpanishLanguage.AddConversation.isDisplayed()) {
    allureReporter.addIssue(
      "Soap note is not generated Even after long time when we restart the app and open same patient soap note is generated in background",
    );
  } else if (
    await SpanishLanguage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    console.log(`Issue Resolved`);
  }

  await SpanishLanguage.SOAPNOTE_Verification();
});
it("Transcript Verification for the Second Conversation for the First Encounter -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await SpanishLanguage.Transcript_Verification();
});
it("Third Conversation (Draft Creation and Completion of Draft Transcript) for the First Encounter -Es", async () => {
  await verifyAndClick(SpanishLanguage.SoapNoteBtn);
  await SpanishLanguage.third_Conversations_For_New_Patient();
});
it("SOAP Note Generation for the Draft Conversation for the First Encounter -Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch (error) {
    allureReporter.addIssue(
      "Soap Note is not generated even after showing loading Page in multiple conversation",
    );
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await SpanishLanguage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
  }

  await SpanishLanguage.SOAPNOTE_Verification();
});
it("Transcript verification for the Third Conversation in First Encounter -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await SpanishLanguage.Transcript_Verification();
});

it("ICD-DPT Codes Generation and Regeneration-Es", async () => {
  await SpanishLanguage.ICD_CPT();
});
it("Care plan Generation and Regeneration-Es", async () => {
  await SpanishLanguage.care_Plan();
});
it("Feedback Generation and Regeneration-Es", async () => {
  await SpanishLanguage.feed_Back();
});
it("Referal Generation and Regeneration-Es", async () => {
  await SpanishLanguage.referal_Letter();
});
it("SoapNote Regeneration-Es", async () => {
  await SpanishLanguage.SOAP_NOTE();
});

it("Patient Info Update -Es", async () => {
  await SpanishLanguage.UpdatePatientInfo();
});
it("Patient info manual update -Es", async () => {
  await SpanishLanguage.manualUpdate();
});
it("Hay Noki update -Es", async () => {
  await SpanishLanguage.hayNoki();
});

it("Finalize encounter -Es", async () => {
  await SpanishLanguage.finalize_Encounter();
});

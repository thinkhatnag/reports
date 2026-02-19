import LoginPage from "../../screenObjectModel/login.page.js";
import AudioManeger from "../../screenObjectModel/audioManeger.js";
import {
  verify,
  verifyAndClick,
  waitForElement,
  aeroplaneModeOn,
  validate,
  aeroplanemodeswipe,
} from "../../../helpers/helper.js";
import allureReporter from "@wdio/allure-reporter";
import SettingsPage from "../../screenObjectModel/setting.page.js";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
import HomePage from "../../screenObjectModel/home.page.js";
import PatientsPage from "../../screenObjectModel/patients.page.js";
import RecordingPage from "../../screenObjectModel/recording.page.js";

beforeEach(() => {
  allureReporter.addSubSuite("New Encounter E2E flow -Es");
});

it("New Encounter Creation -Es", async () => {
  await LoginPage.restartApp();
  await driver.pause(2000);
  await SpanishLanguage.startNewEncounter.click();
  await driver.pause(2000);
  await SpanishLanguage.patientSearch("Naga");
  await SpanishLanguage.startConversation();
});
it("Automatic Sync Verification (Offline to Online and Vice Versa) -Es", async () => {
  await AudioManeger.playAudio("spanish");
  console.log("Audio started:", AudioManeger.currentAudioFile);
  await SpanishLanguage.recordAudioforOfflineModeMT();
  await driver.pause(3000);
  await verifyAndClick(SpanishLanguage.pauseBtn);
  await AudioManeger.pauseAudio();
  console.log("Audio paused at:", AudioManeger.pausedTime, "seconds");
  await driver.pause(10000);
  await SpanishLanguage.PlayBtn.click();
});
it("App Killed and Reopened (Offline Mode Verification) -Es", async () => {
  await AudioManeger.resumeAudio(); //correct
  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(20000); //again playing audio for 1 min in online
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await aeroplaneModeOn();
  await driver.pause(3000);
  await AudioManeger.pauseAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(2000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(SpanishLanguage.RecordingContinueBtn);
  await verifyAndClick(SpanishLanguage.RecordingContinueBtn);
});
it("App Killed in Offline and Reopened in Online Mode Verification -Es", async () => {
  await AudioManeger.resumeAudio();
  await driver.pause(20000);
  await AudioManeger.pauseAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(3000);
  await aeroplanemodeswipe(); //online
  await driver.pause(3000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(SpanishLanguage.RecordingContinueBtn);
  await verifyAndClick(SpanishLanguage.RecordingContinueBtn);
});
it("Offline Mode Stop and App Kill Verification -Es", async () => {
  await aeroplanemodeswipe(); // offline
  await AudioManeger.resumeAudio();
  await driver.pause(20000);
  await AudioManeger.stopAudio();
  await verifyAndClick(SpanishLanguage.stopBtn);
  await driver.pause(3000);
  await verify(SpanishLanguage.offlineConversationSaved);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await verify(SpanishLanguage.offlineConversationSaved);
  await driver.pause(3000);
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(5000);
  await aeroplanemodeswipe(); //online
  await driver.pause(3000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(SpanishLanguage.PrevEncounterRef);
  await verifyAndClick(SpanishLanguage.PrevEncounterRefNo);
});
it("SOAP Note Generation For New Encounter-Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch (error) {
    allureReporter.addIssue(
      "Quick Action Button is not displayed even after long wait waiting",
    );
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await SpanishLanguage.patientSearchAndContinue("Naga");
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
it("Trascript verification -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
  }
  await SpanishLanguage.Transcript_Verification();
});

it("Second Conversation for the New Encounter -Es", async () => {
  await verifyAndClick(SpanishLanguage.SoapNoteBtn);
  if (
    await SpanishLanguage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureReporter.addIssue("the previous encounter is saved as a draft");
    await SpanishLanguage.resumeConversationForMultipleConverstionScenario.click();
    await SpanishLanguage.resumeConversationForMultipleConverstionScenarioYes.click();
  } else if (await SpanishLanguage.AddConversation.isDisplayed()) {
    await verifyAndClick(SpanishLanguage.AddConversation);
    await verifyAndClick(SpanishLanguage.AddConversationConfirmationYes);
  }
  await AudioManeger.playAudio("spanish");
  await driver.pause(3000);
  await aeroplaneModeOn(); //offline
  await driver.pause(60000);
  await AudioManeger.stopAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(3000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await driver.pause(3000);
  await aeroplanemodeswipe(); //online
  await driver.pause(3000);
  await waitForElement(SpanishLanguage.endEncounter);
  await verifyAndClick(SpanishLanguage.endEncounter);
  await driver.pause(5000);
  if (await SpanishLanguage.stopBtn.isDisplayed()) {
    await verifyAndClick(SpanishLanguage.stopBtn);
    await verifyAndClick(SpanishLanguage.PrevEncounterRefYes);
    allureReporter.addIssue(
      "Here even after clicking End Encouter, soap note generation is not Intiated",
    );
  } else {
    console.log("issue related to api is resolved");
  }
});
it("SOAP Note Generation For New Encounter -Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch {
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await SpanishLanguage.patientSearchAndContinue("Naga");
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
    allureReporter.addIssue(
      `The soap note is  genrated instead of showing 'Add Conversation' Button it is showing 'resumeConvesation' is saved as Draft`,
    );
  }
  await SpanishLanguage.SOAPNOTE_Verification();
});
it("Trascript verification for the Second Conversation -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
    await PatientsPage.encounterSelection();
  }
  await SpanishLanguage.Transcript_Verification();
});

it("Third Conversation {Draft Creation and Completion of Draft Transcript}", async () => {
  await verifyAndClick(SpanishLanguage.SoapNoteBtn);
  await SpanishLanguage.third_Conversation_For_Existing_Patitent();
});
it("SOAP Note Generation for the Draft Conversationm-Es", async () => {
  try {
    await waitForElement(SpanishLanguage.quickActionButton);
  } catch (error) {
    if (await SpanishLanguage.quickActionButton.isDisplayed()) {
      await SpanishLanguage.SOAPNOTE_Verification();
    } else {
      allureReporter.addIssue(
        "Quick Action Button is not displayed even after long wait waiting",
      );
      await driver.terminateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await driver.activateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await HomePage.patients.click();
      await SpanishLanguage.patientSearchAndContinue("Naga");
      await PatientsPage.encounterSelection();
      await driver.pause(5000);
    }
  }
  await SpanishLanguage.SOAPNOTE_Verification();
});
it("Transcript Verification for the Draft Conversation -Es", async () => {
  await waitForElement(SpanishLanguage.quickActionButton);
  if (await SpanishLanguage.quickActionButton.isDisplayed()) {
    await SpanishLanguage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue("Naga");
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

it("Hay Noki verification -Es", async () => {
  await SpanishLanguage.hayNoki();
});

it("Finalize Encounter -Es", async () => {
  await SpanishLanguage.finalize_Encounter();
});
it("Logout -Es", async () => {
  await LoginPage.restartApp();
  await waitForElement(HomePage.settings);
  await verifyAndClick(HomePage.settings);
  await verifyAndClick(SpanishLanguage.launguage);
  await verifyAndClick(SpanishLanguage.english);
  await waitForElement(SettingsPage.logoutBtn);
  await verifyAndClick(SettingsPage.logoutBtn);
  await verifyAndClick(SettingsPage.logoutConformationBtn);
  await validate(LoginPage.loginButton);
});

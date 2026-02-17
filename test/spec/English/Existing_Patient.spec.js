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
  await verifyAndClick(RecordingPage.playBtn);
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
  // await verifyAndClick(RecordingPage.errorOk)    // debug app step will not be avalable in the test/prod
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
  await RecordingPage.playBtn.click();
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
      if (await PatientsPage.firstEncounter.isDisplayed()) {
        await PatientsPage.firstEncounter.click();
      } else {
        await PatientsPage.firstEncounterForExistingPatient.click();
      }
      await driver.pause(5000);
    }
  }
  await RecordingPage.SOAPNote_Verification();
});
it("Transcript Verification for the First Conversation", async () => {
  await RecordingPage.Transcript_Verification();
});
it("Second Conversation for the New Encounter", async () => {
  await verifyAndClick(RecordingPage.SoapNoteBtn);
  if (
    await RecordingPage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureReporter.addIssue("the previous encounter is saved as a dreaft ");
    await RecordingPage.resumeConversationForMultipleConverstionScenario.click();
    await RecordingPage.resumeConversationForMultipleConverstionScenarioYes.click();
  } else if (await RecordingPage.AddConversation.isDisplayed()) {
    await verifyAndClick(RecordingPage.AddConversation);
    await verifyAndClick(RecordingPage.AddConversationConfirmationYes);
  }
  await AudioManeger.playAudio("english");
  await driver.pause(5000);

  await aeroplaneModeOff(); //offline
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
  await waitForElement(RecordingPage.PrevEncounterRef);
  await RecordingPage.PrevEncounterRefYes.click();
});
it("SOAP Note Verification for the Second Conversation", async () => {
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
      if (await PatientsPage.firstEncounter.isDisplayed()) {
        await PatientsPage.firstEncounter.click();
      } else {
        await PatientsPage.firstEncounterForExistingPatient.click();
      }
      await driver.pause(5000);
    }
  }
  await RecordingPage.SOAPNote_Verification();
});
it("Transcript Verification for the Second Conversation", async () => {
  await RecordingPage.Transcript_Verification();
});
it("Third Conversation (Draft Creation and Completion of Draft Transcript)", async () => {
  await verifyAndClick(RecordingPage.SoapNoteBtn);
  await RecordingPage.third_Conversation_For_Existing_Patient();
});
it("SOAP Note Generation and Verification for the Draft Conversation", async () => {
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
      if (await PatientsPage.firstEncounter.isDisplayed()) {
        await PatientsPage.firstEncounter.click();
      } else {
        await PatientsPage.firstEncounterForExistingPatient.click();
      }
      await driver.pause(5000);
    }
  }
  await RecordingPage.SOAPNote_Verification();
});

it("Transcript Verification for the Draft Conversation", async () => {
  await RecordingPage.Transcript_Verification();
});

it("Generation and Regeneration of Quick Action Templates (ICD & CPT, Care Plan, Feedback, Referral)", async () => {
  await QuickActions.ICD_CPT();
  await QuickActions.care_Plan();
  await QuickActions.feed_back();
  await QuickActions.referal_Letter();
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

it("Finalize encounter", async () => {
  await RecordingPage.finalize_Encounter();
});
it("Logout ", async () => {
  await LoginPage.restartApp();
  await waitForElement(HomePage.startNewEncounterButton);
  await verifyAndClick(HomePage.settings);
  await verifyAndClick(SettingPage.launguage);
  await verifyAndClick(SettingPage.spanish);
  await verifyAndClick(SpanishLanguage.logoutBtn);
  await verifyAndClick(SpanishLanguage.logoutConformationBtn);
  await verify(SpanishLanguage.loginButton);
});

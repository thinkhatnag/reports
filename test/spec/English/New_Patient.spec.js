import HomePage from "../../screenObjectModel/home.page.js";
import PatientsPage from "../../screenObjectModel/patients.page.js";
import SearchPatientPage from "../../screenObjectModel/searchPatient.page.js";
import RecordingPage from "../../screenObjectModel/recording.page.js";
import LoginPage from "../../screenObjectModel/login.page.js";
import {
  verify,
  verifyAndClick,
  waitForElement,
  aeroplaneModeOff,
  aeroplaneModeOn,
  aeroplanemodeswipe,
} from "../../../helpers/helper.js";
import allureReporter from "@wdio/allure-reporter";
import AudioManeger from "../../screenObjectModel/audioManeger.js";
import AddPatitentPage from "../../screenObjectModel/addPatient.page.js";
import QuickActions from "../../screenObjectModel/quickActions.page.js";
import { pathExists } from "fs-extra";
beforeEach(() => {
  allureReporter.addSubSuite("First Encounter E2E Flow");
});
const shared = { createdPatient: null };
it("Patient Creation", async () => {
  await LoginPage.restartApp();
  await waitForElement(HomePage.startNewEncounterButton);
  await verifyAndClick(HomePage.startNewEncounterButton);
  await driver.pause(2000);
  await verifyAndClick(SearchPatientPage.addPatient);
  await AddPatitentPage.addPatientWrn();
  shared.createdPatient = await AddPatitentPage.createNewPatient();
  console.log("createNewPatient returned:", shared.createdPatient); // ← critical log
});
it("Automatic Sync Verification (Offline to Online and Vice Versa) for the First Encounter", async () => {
  await RecordingPage.startConversation();
  await AudioManeger.playAudio("english");
  console.log("Audio started:", AudioManeger.currentAudioFile);
  await RecordingPage.recordAudioforOfflineModeMT();
  await driver.pause(10000);
  await RecordingPage.pauseBtn.click();
  await AudioManeger.pauseAudio();
  console.log("Audio paused at:", AudioManeger.pausedTime, "seconds");
  await driver.pause(5000);
});
it("App Killed and Reopened (Offline Mode Verification) for the First Encounter", async () => {
  await AudioManeger.resumeAudio(); //correct
  if (await RecordingPage.playBtn.isDisplayed()) {
    await RecordingPage.playBtn.click();
  } else {
    console.log("Issue resolved");
  }
  console.log("Audio resumed:", AudioManeger.currentAudioFile);

  await driver.pause(20000); //again playing audio for 1 min in online});
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await aeroplaneModeOn();
  await driver.pause(5000);
  await AudioManeger.pauseAudio();
  await driver.terminateApp(process.env.BUNDLE_ID);
  await driver.pause(3000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(RecordingPage.ContinueBtn);
  await verifyAndClick(RecordingPage.ContinueBtn);
});

it("App Killed in Offline and Reopened in Online Mode Verification for the First Encounter", async () => {
  await AudioManeger.resumeAudio(); //correct
  console.log("Audio resumed:", AudioManeger.currentAudioFile);
  await driver.pause(30000); //again playing audio for 1 min in online
  await AudioManeger.pauseAudio();
  await driver.pause(2000);
  await driver.terminateApp(process.env.BUNDLE_ID); // step verifying the app screen to be in recording screen even in offline
  await aeroplanemodeswipe(); // online
  await driver.pause(5000);
  await driver.activateApp(process.env.BUNDLE_ID);
  await waitForElement(RecordingPage.ContinueBtn);
  await verifyAndClick(RecordingPage.ContinueBtn);
});
it("Offline Mode Stop and App Kill Verification for the First Encounter", async () => {
  await aeroplanemodeswipe(); //offline
  await AudioManeger.resumeAudio();
  if (await RecordingPage.playBtn.isDisplayed()) {
    await RecordingPage.playBtn.click();
  } else {
    console.log("Issue resolved");
  }
  await driver.pause(20000);
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
});
it("SOAP Note Generation for the First Encounter", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch {
    allureReporter.addIssue(
      "Soap note is not generated Even after long time  when we restart the app and open same patient soap note is generated in background",
    );
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
    await driver.pause(5000);
  }

  await RecordingPage.SOAPNote_Verification();
});
it("Transcript Verification for the First Encounter", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});

it("Second Conversation for the First Encounter", async () => {
  await verifyAndClick(RecordingPage.SoapNoteBtn);
  if (
    await RecordingPage.resumeConversationForMultipleConverstionScenario.isDisplayed()
  ) {
    allureReporter.addIssue(
      `The soap note is  genrated instead of showing 'Add Conversation' Button it is showing 'resumeConvesation's`,
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
  if (await RecordingPage.PrevEncounterRef.isDisplayed()) {
    allureReporter.addIssue(
      "For the First encounter it is showing the poup of previous encounter reference",
    );
    await RecordingPage.PrevEncounterRefNo.click();
  } else {
    console.log(
      "issue related to previous Encounter reference pop up got resolved",
    );
  }
});
it("SOAP Note Generation for the Second Conversation in the First Encounter", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch {
    allureReporter.addIssue("Soap note is not generated Even after long time");
    await driver.terminateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await driver.activateApp(process.env.BUNDLE_ID);
    await driver.pause(5000);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
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
it("Transcript Verification for the Second Conversation in the First Encounter", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});

it("Third Conversation (Draft Creation and Completion of Draft Transcript) for the First Encounter", async () => {
  await RecordingPage.SoapNoteBtn.click();
  await RecordingPage.third_Conversations_For_New_Patient();
});
it("SOAP Note Generation for the Draft Conversation in the First Encounter", async () => {
  try {
    await waitForElement(QuickActions.quickActionButton);
  } catch {
    if (await QuickActions.quickActionButton.isDisplayed()) {
      await RecordingPage.SOAPNote_Verification();
    } else {
      allureReporter.addIssue(
        "Soap note is not generated even after long wait",
      );
      await driver.terminateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await driver.activateApp(process.env.BUNDLE_ID);
      await driver.pause(5000);
      await HomePage.patients.click();
      await PatientsPage.patientSearchAndContinue(shared.createdPatient);
      await PatientsPage.encounterSelection();
      await driver.pause(5000);
    }
  }
  await RecordingPage.SOAPNote_Verification();
});
it("Transcript verification for the Third Conversation in First Encounter", async () => {
  await waitForElement(QuickActions.quickActionButton);
  if (await QuickActions.quickActionButton.isDisplayed()) {
    await RecordingPage.Transcript.click();
  } else {
    await LoginPage.restartApp();
    await waitForElement(HomePage.startConversationBtn);
    await HomePage.patients.click();
    await PatientsPage.patientSearchAndContinue(shared.createdPatient);
    await PatientsPage.encounterSelection();
  }
  await RecordingPage.Transcript_Verification();
});

it("ICD-CPT Codes Generation and Regeneration", async () => {
  await QuickActions.ICD_CPT();
});
it("Care plan Generation and Regeneration", async () => {
  await QuickActions.care_Plan();
});
it("Feedback Generation and Regeneration", async () => {
  await QuickActions.feed_back();
});
it("Referral Generation and Regeneration", async () => {
  await QuickActions.referal_Letter();
});
it("SOAP Note Regeneration", async () => {
  await QuickActions.SOAPNote();
});

it("Patient info update", async () => {
  await RecordingPage.UpdatePatientInfo();
});
it("Patient Info Manual Update", async () => {
  await RecordingPage.manualUpdate();
});
it("HayNoki Update", async () => {
  await RecordingPage.hayNoki();
});

it("Finalize Encounter", async () => {
  await RecordingPage.finalize_Encounter();
});
// });

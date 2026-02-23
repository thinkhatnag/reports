import LoginPage from "../../screenObjectModel/login.page.js";
import HomePage from "../../screenObjectModel/home.page.js";
import { verify, verifyAndClick } from "../../../helpers/helper.js";
import SettingsPage from "../../screenObjectModel/setting.page.js";
import allureReporter from "@wdio/allure-reporter";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
beforeEach(() => {
  allureReporter.addSubSuite("Settings screen");
});
it.skip("Verify Settings screen Profile Edit #Skipped:-Profile edit is skipped due to Known Issue, related to API change", async () => {
  await LoginPage.restartApp();
  await driver.pause(5000);
  await verifyAndClick(HomePage.settings);
  await SettingsPage.profileSettingScreen();
});
it("Verify Settings screen Support Verification", async () => {
  await SettingsPage.support_VerifiCation();
});

it("Verify Settings screen Language and General Settings", async () => {
  await SettingsPage.launguageChange();
});
it("Verify Settings screen General Settings", async () => {
  await SettingsPage.generalSettingsUpdate();
});

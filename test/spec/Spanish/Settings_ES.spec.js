import allureReporter from "@wdio/allure-reporter";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
beforeEach(() => {
  allureReporter.addSubSuite("Settings screen");
});

it.skip("Verify Settings screen Profille Edit #Skipped:-proffile edit is skipped due to Known Issue, related to Api change", async () => {
  await SpanishLanguage.profileSettingScreen();
});
it("Verify Setting's screen support_Verification ", async () => {
  await SpanishLanguage.support_VerifiCation();
});

it("Verify Setting's screen launguage and general settings", async () => {
  await SpanishLanguage.launguageChange();
});
it("Verify Setting's screen general settings", async () => {
  await SpanishLanguage.generalSettingsUpdate();
});

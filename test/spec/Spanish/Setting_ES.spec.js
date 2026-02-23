import allureReporter from "@wdio/allure-reporter";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
beforeEach(() => {
  allureReporter.addSubSuite("Settings screen");
});

it.skip("Verify Settings screen Profile Edit #Skipped:-Profile edit is skipped due to Known Issue, related to API change -Es", async () => {
  await SpanishLanguage.profileSettingScreen();
});
it("Verify Settings screen Support Verification -Es", async () => {
  await SpanishLanguage.support_VerifiCation();
});

it("Verify Settings screen Language and General Settings -Es", async () => {
  await SpanishLanguage.launguageChange();
});
it("Verify Settings screen General Settings -Es", async () => {
  await SpanishLanguage.generalSettingsUpdate();
});

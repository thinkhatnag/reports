import LoginPage from "../../screenObjectModel/login.page.js";
import { verify, verifyAndClick } from "../../../helpers/helper.js";
import SpanishLanguage from "../../screenObjectModel/spanishLanguage.js";
import allureReporter from "@wdio/allure-reporter";

beforeEach(() => {
  allureReporter.addSubSuite("Forgot Password");
});
beforeEach(async () => {
  await LoginPage.restartApp();
});

it(`Error message verification: "Email is not rigisterd" -Es`, async () => {
  await LoginPage.restartApp();
  await verifyAndClick(SpanishLanguage.forgotPassword);
  await SpanishLanguage.enterForgotPasswordEmail("nag.subbarayudu@gmail.com");
  await verify(SpanishLanguage.emailNotRegisteredError);
  await verifyAndClick(SpanishLanguage.loginLink);
});
it(`Error message verification: "Invalid Email" -Es`, async () => {
  await LoginPage.restartApp();
  await verifyAndClick(SpanishLanguage.forgotPassword);
  await SpanishLanguage.enterForgotPasswordEmail("bheema.badri@");
  await verify(SpanishLanguage.invalidEmailError);
  await verifyAndClick(SpanishLanguage.loginLink);
});

it(`Error message verifcation: "Email not Enterd" -Es`, async () => {
  await LoginPage.restartApp();
  await verifyAndClick(SpanishLanguage.forgotPassword);
  await SpanishLanguage.enterForgotPasswordEmail("  ");
  await verify(SpanishLanguage.forgotPasswordEmailError);
  await verifyAndClick(SpanishLanguage.loginLink);
});

it("Verify Reset Password mail generation -Es", async () => {
  await LoginPage.restartApp();
  await verifyAndClick(SpanishLanguage.forgotPassword);
  await SpanishLanguage.enterForgotPasswordEmail(process.env.Email);
  await verify(SpanishLanguage.successMessageForResetLink);
  await verifyAndClick(SpanishLanguage.continueToLogin);
  await LoginPage.activategmailApp();
  await LoginPage.restartApp();
});

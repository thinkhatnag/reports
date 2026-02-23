import LoginPage from "../../screenObjectModel/login.page.js";
import HomePage from "../../screenObjectModel/home.page.js";
import { verify, verifyAndClick } from "../../../helpers/helper.js";
import allureReporter from "@wdio/allure-reporter";
beforeEach(() => {
  allureReporter.addSubSuite("Login");
});
beforeEach(async () => {
  await LoginPage.restartApp();
});

it(`Login Error message verification: "Password not Provided"`, async () => {
  await LoginPage.enterEmail("nag.subbarayudu@thinkhat.ai");
  await LoginPage.selectMultiTenant();
  await LoginPage.clickLogin();
  await verify(LoginPage.errorMessage);
});

it(`Login Error message verification: "Short Password"`, async () => {
  await LoginPage.enterEmail("nag.subbarayudu@thinkhat.ai");
  await LoginPage.enterPassword("123456");
  await LoginPage.selectMultiTenant();
  await LoginPage.clickLogin();
  await verify(LoginPage.shortPassword);
});

it(`Login Error message verification: "Email is not Provided"`, async () => {
  await LoginPage.enterEmail("  ");
  await LoginPage.clickLogin();
  await verify(LoginPage.emailError);
});

it(`Login Error message verification: "Invalid Email"`, async () => {
  await LoginPage.enterEmail("nag.subbarayudu@");
  await LoginPage.clickLogin();
  await verify(LoginPage.invalidEmailError);
});

it(`Login Error message verification: "Unregistered Mail"`, async () => {
  await LoginPage.enterEmail("vqejvcievciye@gmail.com");
  await verify(LoginPage.emailNotRegisteredError);
});

it(`Login Error message verification: "Wrong Password"`, async () => {
  await LoginPage.enterEmail("nag.subbarayudu@thinkhat.ai");
  await LoginPage.enterPassword("Welcome@124");
  await LoginPage.selectMultiTenant();
  await LoginPage.clickLogin();
  await verify(LoginPage.WrongPassword);
});

it("Login with correct Credentials and verify Home screen animation", async () => {
  await LoginPage.enterEmail(process.env.Email);
  await LoginPage.enterPassword(process.env.Password);
  await LoginPage.selectMultiTenant();
  await LoginPage.clickLogin();
  await driver.pause(10000);
  if (await HomePage.notNowBtn.isDisplayed()) {
    await HomePage.notNowBtn.click();
  } else {
    console.log("save password password is not displayed");
  }
  await verify(LoginPage.homescreenAnimation);
});

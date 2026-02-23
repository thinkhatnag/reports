import allureReporter from "@wdio/allure-reporter";
import { addIssue } from "./issueTracker.js";

export function reportIssue(message) {
  allureReporter.addIssue(message);
  addIssue(message);
}

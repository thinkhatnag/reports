let currentIssues = [];

export function addIssue(message) {
  currentIssues.push(message);
}

export function getIssues() {
  return currentIssues;
}

export function clearIssues() {
  currentIssues = [];
}

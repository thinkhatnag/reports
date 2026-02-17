#!/usr/bin/env bash

set -e  # exit immediately if a command fails

git remote set-url origin https://github.com/thinkhatnag/reports.git

git add .
git commit -m "Report Update"
git push origin main


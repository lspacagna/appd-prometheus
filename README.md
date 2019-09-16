# AppD &amp; Prometheus Integration

## Introduction

This extension connects to a Prometheus endpoint and runs the specified queries.
Responses are then parsed (and sometimes transformed) and then passed to AppDynamics as metrics.

## Pre-requisites

1. (Optional) Homebrew - for easier installation and management
2. Node.JS - currently targeting latest LTS version (10.16.3)

```
brew install node
```

3. Yarn (installed via Homebrew) - latest version (1.17.3)

```
brew install yarn
```

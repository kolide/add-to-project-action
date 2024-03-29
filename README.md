# Deprecated

Use https://github.com/actions/add-to-project



# Add to Project

This is a simple github action to add something to an organization
level [github
project](https://docs.github.com/en/issues/organizing-your-work-with-project-boards). It's
designed to work with PRs or Issues, though could be adapted to other
kinds of events. It was written so that workflow action, can _avoid_
checkouts.

Using this requires a PAT with appropriate permissions. I believe that
you can use [this
link](https://github.com/settings/tokens/new?scopes=repo,write:org&description=GHPROJECT_TOKEN)
to create one. At this time, that appears to be:
* `repo` (yes, all of it)
* `write:org`
* `read:org`

It was adapted from the documented [example](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/automating-projects).

## How To Use

(The content_id is determined from the active github context.)

``` yaml
on:
  pull_request:
    branches:
      - main
      - master

jobs:
  add_to_board:
    runs-on: ubuntu-latest
    steps:
      - uses: kolide/add-to-project-action@v1
        with:
          token: ${{secrets.PROJECT_WORKFLOW_PAT}}
          organization: kolide
          project_number: 9
```

### Filtering by Label

In many of our use cases, it's desirable to filter by label. This
supports a simple check against the name. Specify as a comma
delimited string. If the name has a space, it should keep the space. eg:

``` yaml
on:
  issues:
    types: [reopened, labeled]
  pull_request_target:
    types: [reopened, labeled]
    branches:
      - main
      - master

jobs:
  add_to_board:
    runs-on: ubuntu-latest
    steps:
      - uses: kolide/add-to-project-action@v1
        with:
          token: ${{secrets.PROJECT_WORKFLOW_PAT}}
          organization: kolide
          project_number: 9
          only_labeled: "bug,help wanted"

```



## Development & Deployment

This repo stems from the github example javascript action. Reminders about the commands:

| Update Dependencies              | `npm install`        |
| Run Tests (there are none        | `npm test`           |
| build / package for distribution | `npm run prepare`    |
| tag and version                  | (normal git commands |

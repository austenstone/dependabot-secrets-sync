# Dependabot Secrets Sync

Sync secrets from GitHub Actions to Dependabot.

## Usage
Create a workflow (eg: `.github/workflows/dependabot-secrets-sync`). See [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).


### PAT(Personal Access Token)

You will need to [create a PAT(Personal Access Token)](https://github.com/settings/tokens/new?description=dependabot-secrets-sync&scopes=repo%2Cadmin%3Aorg) that has `repo` access.

Add this PAT as a secret so we can use it as input `github-token`, see [Creating encrypted secrets for a repository](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

### Organizations

If your organization has SAML enabled you must authorize the PAT, see [Authorizing a personal access token for use with SAML single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).


#### Example
```yml
name: Usage
on:
  schedule:
    - cron: "0 0 * * *" # every day at midnight

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/dependabot-secrets-sync@main
        with:
          github-token: ${{ secrets.TOKEN }}
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```

#### Example Include List
```yml
      - uses: austenstone/dependabot-secrets-sync@main
        with:
          github-token: ${{ secrets.TOKEN }}
          secrets-include: |
            MY_SECRET
            MY_OTHER_SECRET
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```

#### Example Exclude List
```yml
      - uses: austenstone/dependabot-secrets-sync@main
        with:
          github-token: ${{ secrets.TOKEN }}
          secrets-exclude: |
            GITHUB_TOKEN
            SUPER_SECRET
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```

#### Example Organization
```yml
      - uses: austenstone/dependabot-secrets-sync@main
        with:
          github-token: ${{ secrets.TOKEN }}
          organization: my-org
          secrets-exclude: |
            GITHUB_TOKEN
            SUPER_SECRET
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```

#### Example Organization select repos
```yml
      - uses: austenstone/dependabot-secrets-sync@main
        with:
          github-token: ${{ secrets.TOKEN }}
          organization: my-org
          visibility: selected
          visibility-repos: |
            my-repo
            my-other-repo
          secrets-exclude: |
            GITHUB_TOKEN
            SUPER_SECRET
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```
> [!IMPORTANT]  
> You must pass all secrets to the action via the `SECRETS` environment variable!

## ➡️ Inputs
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| github-token | The GitHub token used to create an authenticated client | ${{ github.token }} |
| organization | Optional organization to run the workflow on. | ${{ github.organization }} |
| owner | Optional repository owner to run the workflow on. | ${{ github.repository_owner }} |
| repo | Optional repository name to run the workflow on. | ${{ github.repository }} |
| secrets-include | Optional list of secrets to include in the action payload. | [] |
| secrets-excluded | Optional list of secrets to exclude from the action payload. | ["GITHUB_TOKEN"] |

<!-- 
## ⬅️ Outputs
| Name | Description |
| --- | - |
| output | The output. |
-->

## Further help
To get more help on the Actions see [documentation](https://docs.github.com/en/actions).

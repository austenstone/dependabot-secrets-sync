# Dependabot Secrets Sync

Sync secrets from GitHub Actions to Dependabot.

## Usage
Create a workflow (eg: `.github/workflows/dependabot-secrets-sync`). See [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).


### PAT(Personal Access Token)

You will need to create a PAT(Personal Access Token) that has `repo` access.

[click here to create PAT](https://github.com/settings/tokens/new?description=dependabot-secrets-sync&scopes=repo%2Cadmin%3Aorg)

Add this PAT as a secret so we can use it as input `github-token`, see [Creating encrypted secrets for a repository](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

### Organizations

If your organization has SAML enabled you must authorize the PAT, see [Authorizing a personal access token for use with SAML single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).

> [!IMPORTANT]  
> You must pass all secrets to the action via the `SECRETS` environment variable!

```yml
        env:
          SECRETS: ${{ toJson(secrets) }} # IMPORTANT: pass all secrets to the action
```

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
        with:
          secrets-include: |
            MY_SECRET
            MY_OTHER_SECRET
```

#### Example Exclude List
```yml
        with:
          secrets-exclude: |
            SUPER_SECRET
            SUPER_OTHER_SECRET
```

#### Example Organization
```yml
        with:
          github-token: ${{ secrets.TOKEN }}
          organization: my-org
          secrets-exclude: |
            SUPER_SECRET
```

#### Example Organization select repos
```yml
        with:
          organization: my-org
          visibility: selected
          visibility-repos: |
            my-repo
            my-other-repo
```

## ➡️ Inputs
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | --- | --- |
| github-token | The GitHub token used to create an authenticated client | ${{ github.token }} |
| organization | Optional organization to run the workflow on. |  |
| owner | Optional repository owner to run the workflow on. | ${{ github.repository_owner }} |
| repo | Optional repository name to run the workflow on. | ${{ github.repository }} |
| secrets-include | Optional list of secrets to include in the action payload. |  |
| secrets-exclude | Optional list of secrets to exclude from the action payload. |  |
| visibility | When using organization secrets. all, private, or selected | private |
| visibility-repos | When using organization secrets. List of repositories to share the secret with. |  |

<!-- 
## ⬅️ Outputs
| Name | Description |
| --- | - |
| output | The output. |
-->

## Further help
To get more help on the Actions see [documentation](https://docs.github.com/en/actions).

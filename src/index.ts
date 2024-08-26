import { endGroup, getBooleanInput, getInput, info, startGroup, warning } from "@actions/core";
import { getOctokit } from "@actions/github";

import _sodium from "libsodium-wrappers";

interface Input {
  token: string;
  enableDependabot: boolean;
  enableCodespaces: boolean;
  secretsInclude: string[];
  secretsExclude: string[];
  organization: string;
  owner: string;
  repo: string;
  visibility: "all" | "private" | "selected";
  visibilityRepos: string[];
}

const getInputs = (): Input => {
  const result = {} as Input;
  result.token = getInput("github-token");
  result.enableDependabot = getBooleanInput("enable-dependabot");
  result.enableCodespaces = getBooleanInput("enable-codespaces");
  result.secretsInclude = getInput("secrets-include")
    .split("\n")
    .filter((x) => x !== "");
  result.secretsExclude = getInput("secrets-exclude")
    .split("\n")
    .filter((x) => x !== "");
  result.organization = getInput("organization");
  result.visibility = (getInput("visibility") || "all") as
    | "all"
    | "private"
    | "selected";
  result.visibilityRepos = getInput("visibility-repos")
    .split("\n")
    .filter((x) => x !== "");
  result.owner = getInput("owner");
  result.repo = getInput("repo");
  if (result.repo.includes("/")) {
    result.repo = result.repo.split("/")[1];
  }
  return result;
};

export const run = async (): Promise<void> => {
  const input = getInputs();
  const octokit = getOctokit(input.token);
  const _envSecrets: { [key: string]: string } = JSON.parse(
    process.env.SECRETS || "{}",
  );
  const secrets: { [key: string]: string } = {};

  if (input.secretsInclude.length) {
    for (const key of input.secretsInclude) secrets[key] = _envSecrets[key]
  } else { // all secrets
    Object.assign(secrets, _envSecrets);
  }
  for (const key of input.secretsExclude) delete secrets[key];
  for (const key of Object.keys(secrets)) {
    if (key.toLowerCase().startsWith("github")) {
      delete secrets[key];
      const warningMessage = `Secret '${key}' starts with 'github' and will not be added.`;
      warning(warningMessage);
    }
  }
  if (Object.keys(secrets).length === 0) {
    return warning("No secrets to add.");
  }
  startGroup("Secrets to add");
  for (const key of Object.keys(secrets)) info(key);
  endGroup();

  const { key, key_id } = (
    await (input.organization
      ? octokit.rest.dependabot.getOrgPublicKey({
        org: input.organization,
      })
      : octokit.rest.dependabot.getRepoPublicKey({
        owner: input.owner,
        repo: input.repo,
      }))
  ).data;

  const selectedRepositoryIds = await Promise.all(
    input.visibilityRepos.map(async (repo: string) => {
      const { data } = await octokit.rest.repos.get({
        owner: input.organization,
        repo,
      });
      return data.id;
    }),
  );

  await _sodium.ready;
  const sodium = _sodium;
  const encryptSecret = (secret: string): string => {
    const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secret);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    const output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
    return output;
  };
  for (const [secretKey, secretValue] of Object.entries(secrets)) {
    const payload = {
      secret_name: secretKey,
      encrypted_value: encryptSecret(secretValue),
      key_id,
    };
    if (input.enableDependabot) {
      await (
        input.organization ? octokit.rest.dependabot.createOrUpdateOrgSecret({
          org: input.organization,
          visibility: input.visibility,
          selected_repository_ids: selectedRepositoryIds.map((id) =>
            id.toString(),
          ),
          ...payload,
        }) : octokit.rest.dependabot.createOrUpdateRepoSecret({
          owner: input.owner,
          repo: input.repo,
          ...payload,
        })
      );
      info(`Added dependabot secret: ${key}`);
    }

    if (input.enableCodespaces) {
      await (
        input.organization ? octokit.rest.codespaces.createOrUpdateOrgSecret({
          org: input.organization,
          visibility: input.visibility,
          selected_repository_ids: selectedRepositoryIds.map((id) =>
            id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any,
          ...payload,
        }) : octokit.rest.codespaces.createOrUpdateRepoSecret({
          owner: input.owner,
          repo: input.repo,
          ...payload,
        })
      );
      info(`Added codespaces secret: ${key}`);
    }
  }
};

run();

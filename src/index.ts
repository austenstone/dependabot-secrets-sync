import { endGroup, getInput, info, startGroup, warning } from "@actions/core";
import { getOctokit } from "@actions/github";

import _sodium from 'libsodium-wrappers';

interface Input {
  token: string;
  secretsInclude: string[];
  secretsExclude: string[];
  organization: string;
  owner: string;
  repo: string;
  visibility: 'all' | 'private' | 'selected';
  visibilityRepos: string[];
}

const getInputs = (): Input => {
  const result = {} as Input;
  result.token = getInput("github-token");
  result.secretsInclude = getInput("secrets-include").split('\n').filter(x => x !== '');
  result.secretsExclude = getInput("secrets-exclude").split('\n').filter(x => x !== '');
  result.organization = getInput("organization");
  result.visibility = (getInput("visibility") || 'all') as 'all' | 'private' | 'selected';
  result.visibilityRepos = getInput("visibility-repos").split('\n').filter(x => x !== '');
  result.owner = getInput("owner");
  result.repo = getInput("repo");
  if (result.repo.includes('/')) {
    result.repo = result.repo.split('/')[1];
  }
  return result;
}

export const run = async (): Promise<void> => {
  const input = getInputs();
  const octokit = getOctokit(input.token);
  const _envSecrets: { [key: string]: string; } = JSON.parse(process.env.SECRETS || '{}');
  const secrets: { [key: string]: string; } = {};

  if (input.secretsInclude.length > 0) {
    input.secretsInclude.forEach((key) => secrets[key] = _envSecrets[key]);
  } else {
    Object.assign(secrets, _envSecrets);
  }
  input.secretsExclude.forEach((key: string) => delete secrets[key]);
  Object.keys(secrets).forEach((key: string) => {
    if (key.toLowerCase().startsWith('github')) {
      delete secrets[key];
      warning(`Secret '${key}' starts with 'github' and will not be added.`);
    }
  });

  if (Object.keys(secrets).length === 0) {
    warning('No secrets to add.');
    return;
  }
  startGroup('Secrets to add');
  Object.keys(secrets).forEach((key: string) => info(key));
  endGroup();

  const {
    key,
    key_id
  } = (await (input.organization ? octokit.rest.dependabot.getOrgPublicKey({
    org: input.organization,
  }) : octokit.rest.dependabot.getRepoPublicKey({
    owner: input.owner,
    repo: input.repo,
  }))).data;

  const selectedRepositoryIds = await Promise.all(input.visibilityRepos.map(async (repo: string) => {
    const { data } = await octokit.rest.repos.get({
      owner: input.organization,
      repo: repo,
    });
    return data.id;
  }));

  await _sodium.ready;
  const sodium = _sodium;
  const encryptSecret = (secret: string): string => {
    let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
    let binsec = sodium.from_string(secret)
    let encBytes = sodium.crypto_box_seal(binsec, binkey)
    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
    return output;
  }
  Object.entries(secrets).forEach(async ([key, value]) => {
    const payload = {
      secret_name: key,
      encrypted_value: encryptSecret(value),
      key_id,
    };
    await (input.organization ? octokit.rest.dependabot.createOrUpdateOrgSecret({
      org: input.organization,
      ...payload,
      visibility: input.visibility,
      selected_repository_ids: selectedRepositoryIds.map(id => id.toString()),
    }) : octokit.rest.dependabot.createOrUpdateRepoSecret({
      owner: input.owner,
      repo: input.repo,
      ...payload
    }));
    info(`Added: ${key}`);
  });
};

run();

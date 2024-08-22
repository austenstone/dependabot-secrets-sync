import { getInput, info } from "@actions/core";
import { getOctokit } from "@actions/github";

import _sodium from 'libsodium-wrappers';

interface Input {
  token: string;
  secrets: string | undefined;
  owner: string;
  repo: string;
}

const getInputs = (): Input => {
  const result = {} as Input;
  result.token = getInput("github-token");
  result.secrets = process.env.SECRETS;
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

  info(`All secrets: ${input.secrets}`);

  const key = (await octokit.rest.dependabot.getRepoPublicKey({
    owner: input.owner,
    repo: input.repo,
  })).data.key;

  await _sodium.ready;
  const sodium = _sodium;
  const encryptSecret = (secret: string): string => {
    let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
    let binsec = sodium.from_string(secret)
    let encBytes = sodium.crypto_box_seal(binsec, binkey)
    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
    return output;
  }

  octokit.rest.dependabot.createOrUpdateRepoSecret({
    owner: input.owner,
    repo: input.repo,
    secret_name: "SECRETS",
    encrypted_value: encryptSecret('123'),
  });
};

run();

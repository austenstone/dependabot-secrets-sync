import { getInput, info } from "@actions/core";
import { getOctokit } from "@actions/github";

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

  octokit.rest.dependabot.createOrUpdateRepoSecret({
    owner: input.owner,
    repo: input.repo,
    secret_name: "SECRETS",
    encrypted_value: '123'
  });
};

run();

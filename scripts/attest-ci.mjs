import { execFileSync } from 'node:child_process';

if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Only main CI can attest');
const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
url.searchParams.set('audience', 'https://api.antl.fr/antl-release');
const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` } });
if (!response.ok) throw new Error(`OIDC failed: ${response.status}`);
const { value } = await response.json();
const repository = process.env.GITHUB_REPOSITORY.split('/')[1];
if (!['USV', 'script'].includes(repository) || !/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA)) throw new Error('Unexpected component');
execFileSync('ssh', ['-i', process.env.DEPLOY_KEY_PATH, '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes', '-o', `UserKnownHostsFile=${process.env.DEPLOY_KNOWN_HOSTS}`, 'antl-deploy@46.225.98.62', `verify-component ${repository} ${process.env.GITHUB_SHA}`], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });

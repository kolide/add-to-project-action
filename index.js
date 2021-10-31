const core = require('@actions/core');
const wait = require('./wait');

const project_metadata_query = `
query($org: String!, $number: Int!) {
  organization(login: $org){
    projectNext(number: $number) {
      id
      fields(first:20) {
	nodes {
	  id
	  name
	  settings
	}
      }
    }
  }
}`;

const add_to_project_mutation = `
mutation($project:ID!, $target:ID!) {
  addProjectNextItem(input: {projectId: $project, contentId: $target}) {
    projectNextItem {
      id
    }
  }
}`;

async function gh_query(token, query, variables) {
  return fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `bearer ${token}`
    }
  }).then(function(response) {
    return response.json();
  });
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    const github_token = core.getInput("token");
    const organization = core.getInput("organization");
    const project_number = core.getInput("project_number");
    const content_id = core.getInput("content_id");
    core.info(`Going to add ${content_id} to ${organization}/${project_number}`);


    const project_metadata_vars = { org: organization, number: parseInt(project_number) };
    const project_metadata_resp = await gh_query(github_token, project_metadata_query, project_metadata_vars);
    core.debug(project_metadata_resp);

    const project_id = project_metadata_resp["data"]["organization"]["projectNext"]["id"];
    core.debug(`Found project_id: ${project_id}`);

    const mutation_vars = { project: project_metadata_vars, target: content_id };
    const mutation_resp = await gh_query(github_token, add_to_project_mutation, mutation_vars};
    core.debug(mutation_resp);

    const card_id = mutation_resp["data"]["addProjectNextItem"]["projectNextItem"]["id"];
    core.debug(`Got card_id: ${card_id}`);

    core.setOutput('card_id', card_id);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

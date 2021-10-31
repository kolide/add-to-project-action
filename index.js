import * as core from '@actions/core'
import * as github from '@actions/github'

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

const getContentMetadata = context => {
  switch(context.eventName) {
  case 'pull_request', 'pull_request_target':
    return {id: context.payload.pull_request.node_id, labels: context.payload.pull_request.labels };
  case 'issues':
    return {id: context.payload.issue.node_id, labels: context.payload.issue.labels };
  default:
    throw new Error(`Unknown event type ${context.eventName}`);
  };
};

// Does the provided only_labeled filter match the labels on the item in question?
const labelFilterMatch = (only_labeled, labels) => {
  if(only_labeled.length == 0) {
    return true;
  }

  // Any matches? This maps the label to get just then name, then
  // method chains to filter to what we want.
  return labels
    .map(l => l.name)
    .filter(l => only_labeled.includes(l))
    .length > 0;
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    const organization = core.getInput("organization");
    const project_number = core.getInput("project_number");
    const only_labeled = core.getInput("only_labeled").split(',');

    const content_metadata = getContentMetadata(github.context);

    if(!labelFilterMatch(only_labeled, content_metadata.labels)) {
      console.info("No matching labels. Skipping");
      return;
    }

    core.info(`Going to add '${content_metadata.id}' to ${organization}/${project_number}`);

    const octokit = github.getOctokit(core.getInput("token"));

    const project_metadata_resp = await octokit.graphql(
      project_metadata_query,
      { org: organization, number: parseInt(project_number) }
    );
    core.debug("Project Metadata:")
    core.debug(JSON.stringify(project_metadata_resp));

    const project_id = project_metadata_resp["organization"]["projectNext"]["id"];
    core.debug(`Found project_id: ${project_id}`);

    const mutation_resp = await octokit.graphql(
      add_to_project_mutation,
      { project: project_id, target: content_metadata.id }
    );
    core.debug("Mutation Response:")
    core.debug(JSON.stringify(mutation_resp));

    const card_id = mutation_resp["addProjectNextItem"]["projectNextItem"]["id"];
    core.debug(`Got card_id: ${card_id}`);

    core.setOutput('card_id', card_id);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

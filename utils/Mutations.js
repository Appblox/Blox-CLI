const cloneTr = ({ data }) => data.cloneTemplateRepository.repository
const clone = `mutation($description:String, $templateRepo:ID!,$owner:ID!,$name:String!,$visibility:RepositoryVisibility!){
    cloneTemplateRepository(input: { description:$description, repositoryId: $templateRepo, name: $name, ownerId: $owner, visibility: $visibility}) {
      repository {
        id
        resourcePath
        description
        visibility
        url
        sshUrl
        name
      }
    }
  }`

const createTr = ({ data }) => data.createRepository.repository
const create = `mutation( $template:Boolean, $description:String, $team:ID,$owner:ID,$name:String!,$visibility:RepositoryVisibility!){
  createRepository(input: {template:$template, description:$description, ownerId: $owner, teamId: $team, name: $name, visibility: $visibility}){
    repository{
      id
      resourcePath
      description
      visibility
      name
      url
      sshUrl
    }
  }
}`
module.exports = {
  cloneTemplateRepository: { Q: clone, Tr: cloneTr },
  createRepository: { Q: create, Tr: createTr },
}

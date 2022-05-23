const inquirer = require('inquirer')
const customList = require('./utils/cutomListV2')
const GitPaginator = require('./utils/paginateGitRest')

inquirer.registerPrompt('customList', customList)

// async function test() {
//   const l = 'https://api.github.com'
//   const headers = {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${configstore.get('githubUserToken')}`,
//     Accept: 'application/vnd.github.v3+json',
//   }

//   const resp = await axios.get(`${l}/user/repos`, { headers, params: { per_page: 2, page: 1 } })
//   console.log(resp)
//   const p = parse(resp.headers.link)
//   console.log(p)
// }

const test = async () => {
  // const p = await new GitPaginator('user/repos', (d) => ({ id: d.id, name: d.name })).getAllPages()
  // console.log(p)
  function getTemplate() {
    const questions = [
      {
        type: 'confirm',
        name: 'createFromTemplate',
        message: 'Create repo from a template',
      },
      {
        type: 'customList',
        name: 'selectTemplate',
        message: 'select a template repo',
        choices: [], // give empty list, custom list loads from api
        // source: new NewLS(userRepos.Q, userRepos.Tr_t).sourceAll,
        source: new GitPaginator('user/repos', (d) => ({ name: d.name, id: d.id })),
        pageSize: 22,
        loop: false,
        when: (ans) => ans.createFromTemplate,
      },
    ]
    return inquirer
      .prompt(questions)
      .then((ans) => ans.selectTemplate || null)
      .catch((err) => console.log(err, 'lll'))
  }
  const a = await getTemplate()
  console.log(a)
}
test()

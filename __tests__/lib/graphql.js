const http = require('axios')

function throwOnErrors({ query, variables, errors }) {
    if (errors) {
        const message = `
            query: ${query.substr(0, 100)}
            variables: ${JSON.stringify(variables, null, 2)}
            errors: ${JSON.stringify(errors, null, 2)}
        `

        throw new Error(message)
    }
}

module.exports = async ({ url, query, variables = {}, auth }) => {
    try {
        const headers = {}

        if (auth) {
            headers.Authorization = auth
        }

        const resp = await http({
            method: 'post',
            url,
            headers,
            data: {
                query,
                variables: JSON.stringify(variables)
            }
        })

        const { data, errors } = resp.data;

        throwOnErrors({ query, variables, errors })

        return data;
    } catch (err) {
        const errors = err.response && err.response.data && err.response.data.errors
        throwOnErrors({ query, variables, errors })
        throw err;
    }
}
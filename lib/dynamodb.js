const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { throwWithLabel } = require("./utils");

class DynamoDB {
    #client;
    #tableName;
    constructor({ region, tableName }) {
        const ddb = new DynamoDBClient({ region });
        this.#client = DynamoDBDocumentClient.from(ddb);
        this.#tableName = tableName
    }

    async get(id) {
        try {
            if (!this.#client) throw Error("Cannot find required DDB client")
            const getCmd = new GetCommand({
                TableName: this.#tableName,
                Key: {
                    id
                }
            })
            return await this.#client.send(getCmd)
        } catch (caught) {
            throwWithLabel(caught, `${this.#tableName}.get`)
        }
    }

    async transactWrite(input) {
        try {
            const command = new TransactWriteCommand(input);
            const resp = await this.#client.send(command)
            if (resp.$metadata.httpStatusCode !== 200) {
                console.info('TransactiWrite ::', resp)
                throw Error('Problems with TransactiWrite')
            }

            return resp
        } catch (caught) {
            throwWithLabel(caught, `${this.#tableName}.transactWrite`)
        }

    }
}

module.exports = DynamoDB
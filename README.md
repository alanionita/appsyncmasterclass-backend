# AppSync Masterclass - Remix (Yan Cui)

A clone of the [AppSync Masterclass repo](https://github.com/theburningmonk/appsyncmasterclass-backend), with some vital changes in module versions. 

Buy the course at - https://www.appsyncmasterclass.com/

## ✨ Features

- **Serverless Framework v3.39.x**: Newest version of the open-source Serverless Framework
- **AWS SDK v3.758**: Newest version of the AWS SDK
- **serverless-appsync-plugin v2.9.1**: Newest version 
- **serverless-iam-roles-per-function v3.2**: Newest version 
- **serverless-export-env - removed**: Removed this package because from testing it checked live services for env data vs doing something smaller in scope like checking CF output; was happy to populate the .env files manually instead

## Roadmap

- [ ] Replace serverless.yml with serverless.ts
- [ ] Add deeper type specifications to the whole solution

## 📦 Installation

### Prerequisites
- aws-cli: installed on the machine and configured
- AWS Console: account created and IAM accounts and permissions generated accordingly

### ⚙️ Configuration

> NB. Assuming you cloned the repo already, right?

#### 1. Create .env file 

```
AWS_NODEJS_CONNECTION_REUSE_ENABLED=1
STAGE=
REGION=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
USERS_TABLE=
APPSYNC_HTTP_URL=
BUCKET_NAME=
```

#### 2. Install packages

```
npm install
```

## 🚀 Usage

Check Serverless Framework package

```
npm run sls -- package
```

Deploy stack

```
npm run deploy
```

Deploy single function, where * is the name of your function to be deployed

```
npm run deploy:fn -- *

```

Create a test Cognito user, once deployed. Replace the REGION in the script with your region.

```
/bin/bash scripts/cg-create-new-user.sh CLIENT_ID EMAIL PWD "NAME"
```

## 📚 Documentation

More docs are available to follow the updates per video. 

- [DIFF](./docs/DIFF.md)


External docs:
- serverless-appsync-plugin - https://github.com/sid88in/serverless-appsync-plugin/tree/master
- AWS-SDK v3 - https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/
- Cognito::UserPool spec - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html
- Cognito::UserPoolClient spec - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpoolclient.html
- AWS DynamoDB resolver mapping template reference - https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-reference-dynamodb.html
- AWS DynamoDB reserved names - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
- AWS CLI docs - https://docs.aws.amazon.com/cli/latest/reference

## 🔍 Testing

Running the tests, where * is one of : ["integration", "e2e"]

```
npm run test:*

```

## 🙏 Acknowledgements

Docs from:
- [Yan Cui](https://github.com/theburningmonk)
- [Original AppSync Masterclass](https://github.com/theburningmonk/appsyncmasterclass-backend)
- [AppSync Masterclass course](https://www.appsyncmasterclass.com/)

## Author

Alan Ionita @2025
Yan Cui @2020

## 📜 License

Abiding to the spirit of remixing, this project provide under the original license, [MIT](https://github.com/theburningmonk/appsyncmasterclass-backend?tab=MIT-1-ov-file#readme)

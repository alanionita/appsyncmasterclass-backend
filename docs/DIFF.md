# Diffs 

Log changes in this repo following the same release tags from the original repo.

Please note that some changes are under commits and others are under links. 

Regardless, both methods allow you to follow along at the same pace as the original course.

The log below is in accending lesson order from 04-01-* onwards: 

## Log

### 04-01-Set_up_the_backend_project

Diffs:

- Used latest version of `serverless` package v3.9, possibly the last open-source version; a reasonably stable version for a while
- Used latest version of `serverless-appsync-plugin`
- appsync.yml:Notice that the AppSync definition api is different in later versions; chose to store the definition within a `serverless/` - helps to maintain all serverless definitions in one central local; as a refactor should move function definitions to a `serverless/lambda.yml` file.
- appsync.yml: different authentication definition

```yml
# serverless.yml

appSync: ${file(./serverless/appsync.yml)}


# serverless/appsync.yml

name: appsyncmasterclass

schema: 'schemas/*.graphql'

authentication:
  type: 'AMAZON_COGNITO_USER_POOLS'
  config:
    awsRegion: eu-west-2 # defaults to stack region 
    defaultAction: ALLOW
    userPoolId: !Ref CognitoUserPool

```
- Compatibility issues between the two (mentioned in video), haven't occurred with the later versions
- `serverless.yml:provider.runtime` was set to `nodejs20.x`; to match the most current supported Node runtime for Lambda

> The commit link is below, sorry - 1 commit handled changes for 3 tags

### 04-02-Designing_the_graphql_schema

Diffs:
- None

Commit - https://github.com/alanionita/appsyncmasterclass-backend/commit/48b53441cedbe438a64e1351966b3e392c1dd2a0#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519

### 04-03-Configure_Cognito_User_Pool

Diffs:
- CognitoUserPool: Added stronger password rules, but still no where near production level 

Commit - https://github.com/alanionita/appsyncmasterclass-backend/commit/bfb1933b3c836eef7b218115bff3321abed6f218

### 04-04-Save_user_profile_on_PostConfirmation

Diffs:
- Adds `schemas/` folder for GraphQL schema definitions
- AppSync definition: Implemented the schema import as all files from this folder
- UsersTable: added further tags: CanIDelete, Author, CreatedOn
- serverless-iam-roles-per-function: adds latest version 
- Lambda.handler: Use @aws-sdk v3 as such installs `@aws-sdk/client-dynamodb`
- Lambda.handler: uses "command" syntax in compliance with @aws-sdk
- Lambda.handler: implements more error handling and logging via try/catch
- CgSignupPerm: implements both `SourceAccount` and `SourceArn` since `SourceAccount` has a character limit of 12 and previous implementation was storing the ARN there (which is usually more than 12 characters)
- serverless.yml: does pass REGION as enviroment variable, used in DynamoDB Client initialisation; potentially insecure


Commit ["appsync.yml"] - https://github.com/alanionita/appsyncmasterclass-backend/commit/4672be5e581b650d78b044adf73360f502b4575a

Commit ["Cognito client"] - https://github.com/alanionita/appsyncmasterclass-backend/commit/c36015262fac343fea58979fe46dbf472ceda76d

Commit ["Users table] - https://github.com/alanionita/appsyncmasterclass-backend/commit/44145db32e98c69630bc5b087c58b9a25bdc67e3

Commit [package.json] - https://github.com/alanionita/appsyncmasterclass-backend/commit/6cfef081230d2fb35a4e3fe6dbb2ae3e7d7395af

Commit [serverless.yml / Lambda definition] - https://github.com/alanionita/appsyncmasterclass-backend/commit/1b279b570a1cb5ae9457694f013cc0dd9e060a3b

Commit [serverless.yml / Lambda post confirmation and permission] - https://github.com/alanionita/appsyncmasterclass-backend/commit/6f6375332bae344d7299b621b86e9aacf63be9a7

Commit [Lambda.handler] - https://github.com/alanionita/appsyncmasterclass-backend/commit/459e3e6a3bab7af9a2bfb17e24eea7dc810c34f2

Commit [serverless.yml / Permission fix] - https://github.com/alanionita/appsyncmasterclass-backend/commit/7fcafa898944993c3bda33630caefae502585edf

### 04-06-Add_integration_test_for_confirmUserSignup

Diffs: 
- Packages: does not use `serverless-export-env`, implements relevant DynamoDB submodules from @aws-sdk; replaces `package.json:scripts/integration-test` with scoped command `test:integration`
- Lambda.handler: uses `PutCommand` instead of `PutItemCommand` 
- __tests__/case/*: remove articles and pronouns from function names; defined data string regex as separate variable
- __tests__/steps/when: expanded error handling
- __tests__/steps/then: implemented @aws-sdk:v3/DynamoDB for GetItem and unmarshalling that data
- __tests__/steps/given: expanded to handle harder password rules
- package.json:scripts: adds script to deploy single functions
- .test suffix: renamed .tests to .test

Commit [package.json] - https://github.com/alanionita/appsyncmasterclass-backend/commit/3ec0d81cd331f50c79063bb2874b63ebbf74fae0

Commit [__tests__/*] - https://github.com/alanionita/appsyncmasterclass-backend/commit/4aeafc082973a2db7d7266e954ae5892bd673cb1#diff-b6b07c89c7af389053945870f93624c899f2bd975a2bfb83a4ba4afa6f93ca5d

Commit [package.json:scripts] - https://github.com/alanionita/appsyncmasterclass-backend/commit/b6acdc012a60172538632311eee9bc28e8424db1

Commit [suffix] - https://github.com/alanionita/appsyncmasterclass-backend/commit/6b5fb6cb5d9d063024be175e3ac86478bca39efa

### 04-07-Add_acceptance_test_for_confirmUserSignup

Diffs:
- __tests__/steps/when: Adds @aws-sdk:v3 Cognito commands for AdminConfirmSignUpCommand, SignUpCommand; expands error handling; add try/catch
- package.json:scripts: Adds scoped `test:e2e` script
- package.json:devDependencies: Adds `@aws-sdk/client-cognito-identity-provider` Cognito SDK module

Commit - https://github.com/alanionita/appsyncmasterclass-backend/commit/68fe5ced5b0f96fe8b1c047af29fa655da36c767#diff-7ae45ad102eab3b6d7e7896acd08c427a9b25b346470d7bc6507b6481575d519

### 04-08-Implement_getMyProfile_query

Diffs:
- serverless.yml/appsync.yml: serverless-appsync-plugin@v2 uses a different api for resolvers; mappingTemplate -> resolvers; mappingTemplatesLocation: no longer in use; since the api change decided to change the `mapping-template` folder to `appsync/resolvers/*`; 
- serverless.yml/appsync.yml: resolver definition is different in v2; by default the resolvers are Javascript and Kind is Pipeline; to use VTL we must use `Kind: unit` and have `request` and `response` fields; the fields are relative to the top-level `serverless.yml`

Commit - https://github.com/alanionita/appsyncmasterclass-backend/commit/7d5fece02613d1170f0fd8228aa7be7bf4670975

### 04-09-Add_unit_test_for_getMyProfile_query

Diffs: 
- package.json:devDependencies : @aws-amplify/amplify-appsync-simulator instead of old version; using the newer version because the old one wasn't updated in 3yrs; this is technically from amplify Gen2, but the api used here is largely the same
- package.json: scripts: adds scope unit test script `test:unit`
- error handlings: implements try/catch in methods

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/04-08-Implement_getMyProfile_query...04-09-Add_unit_test_for_getMyProfile_query

### 04-10-Add_acceptance_test_for_getMyProfile_query

Diffs:
- package.json: does not add lodash, choose to use native solution
- authenticated_user(): implements when.user_signs_up() and then uses aws-sdk v3 to trigger cognito.InitiateAuthCommand; adds extra validation for the auth response like throwing if there are extra challenges or if the tokens are missing

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/04-09-Add_unit_test_for_getMyProfile_query...04-10-Add_acceptance_test_for_getMyProfile_query


### 04-11-Capture_AppSync_GraphQLUrl_in_.env

Diff:
- serverless.yml: used the `${appsync:url}` from serverless-appsync-plugin v2
- Skipped installing the suggested serverless-plugins

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-11-Capture_AppSync_GraphQLUrl_in_.env

### 04-12-Implement_editMyProfile_mutation

Diff:
- Mutation.editMyProfile: mutation resolvers defined using serverless-appsync-plugin v2 format

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-12-Implement_editMyProfile_mutation

### 04-13-Add_tests_for_editMyProfile_mutation

Diff: 
- when.invoke_appsync_template: required extra logic to clean up trailing commas from the vtl.render output
- given: abstracted away random_name_email, random_pwd, in order to make them more reusable in test

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-13-Add_tests_for_editMyProfile_mutation

### 04-14-Implement_getImageUploadUrl_query

Diffs:
- packages/aws-sdk: installs s3Client and s3-presigner modules
- handler: implements the same logic using commands; add more validation and errors
- serverless: moves lambda definitions to separate serverless/functions.yml folder
- appsync.yml: adds resolver definitions in new serverless-appsync-plugin v2

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-14-Implement_getImageUploadUrl_query

### 04-15-Add_unit_test_for_getImageUploadUrl_query

Diffs: 
- when/invoke_getImgUploadUrl: handled Content-Type here even though it can no longer be configure like this; left it as is in order to not refactor too much
- when/invoke_getImgUploadUrl: Adds more error handling
- tests/unit/getImgUploadUrl: decided to remove the ContentType check from the pattern matching because the URLs are not returning Content-Type; 
- tests/unit/getImgUploadUrl: adds test for throwing if exception is found, and defaulting to jpeg Content-Type

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-15-Add_unit_test_for_getImageUploadUrl_query

### *agi-01-yml-refactors-pre-signup

> Custom changes, not related to the overall course, but adding improvements nonetheless

Diffs:
- serverless.yml: refactored Resources and moved all the cognito specs to `serverless/cognito.yml`; plan to keep doing this the more services there are
- serverless.yml: mapped out Outputs to .env requirements, making sure that the stack returns everything I need to populate the .env
- pre-user-signup: got tired of the confirming for users I need to use in AppSync console so added a PreSignup trigger and autoconfirming all users by default
- package.json: added a new script to deploy:loud which show the outputs in the console

Release: 
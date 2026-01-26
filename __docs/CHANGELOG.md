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

### agi-01-yml-refactors-pre-signup

> Custom changes, not related to the overall course, but adding improvements nonetheless

Diffs:
- serverless.yml: refactored Resources and moved all the cognito specs to `serverless/cognito.yml`; plan to keep doing this the more services there are
- serverless.yml: mapped out Outputs to .env requirements, making sure that the stack returns everything I need to populate the .env
- pre-user-signup: got tired of the confirming for users I need to use in AppSync console so added a PreSignup trigger and autoconfirming all users by default
- package.json: added a new script to deploy:loud which show the outputs in the console

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/agi-01-yml-refactors-pre-signup

### 04-16-Add_acceptance_test_for_getImageUploadUrl_query

Diffs:
- tests/lib: Instead of relying on the existing string, download produces a presigned url to perform a Get request from the bucket
- s3: Original guidance from course is to use ACLs and to create a public bucket; buckets come private by default and ACLs are disabled and no longer recommended; it's actually harder to unlock a bucket and make it public that it is to interact with a private bucket; here's I'm letting the bucket be default closed, but this means that both upload_file() and download_file(), require a presigned url; in turn this will also propagate to the GraphQL queries that fetch imgUrl, bgImgUrl or any new images, whereby these queries will need to trigger lambdas per each img asset field such that they can generate a presigned get url; potential lifecyle issues on the frontend since the pre-signed url will only be alive for 1m, but can be mitigated with asset caching.

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-16-Add_acceptance_test_for_getImageUploadUrl_query

### 04-17-Implement_tweet_mutation

Diffs:
- functions/tweet: implements TransactWrite using aws-sdk v3 command pattern; add more code guards and error handling

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-17-Implement_tweet_mutation

### 04-18-Add_integration_test_for_tweet

Diffs:
- tests/steps/then: adds more generic implementation of Get command from DynamoDB using aws-sdk v3 patterns; abstracted into helper functions; implemented in table contains functions in order to allow for individual validation depending on table
- tests/cases/integration: adds waitSec helped function to make sure the user is present in tables; implements the above table_contains functions

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-18-Add_integration_test_for_tweet

### 04-19-Add_acceptance_test_for_tweet

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-19-Add_acceptance_test_for_tweet

### 04-20-Implement_getTweets_query

Diffs:
- Query.getTweets: adds validation step in VTL for .nextToken, since the field is optional; uses v2 syntax definitions for serverless-plugin-appsync
- Tweet.profile: adds nested resolver definition using v2 serverless-plugin-appsync

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-20-Implement_getTweets_query

### 04-21-Add_unit_test_for_getTweets_query

Diffs: 
- tests/Query.getTweets.request.test.js: adds more tests to handle success path and extra nextToken validation

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-21-Add_unit_test_for_getTweets_query

### 04-22-Add_acceptance_test_for_getTweets_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-22-Add_acceptance_test_for_getTweets_query

### 04-23-Implement_getMyTimeline_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-23-Implement_getMyTimeline_query

### 04-24-Add_tests_for_getMyTimeline_query

Diffs:
- given.random_appsync_contextV2: adds new method that takes 1 param instead of 4; uses named keys so easier to see what you passed and didnt; will replace old implmentations of random_appsync_context with this
- tests/e2e/TimelinePage: when testing for list generation added 2 tweet items instead of 1

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-24-Add_tests_for_getMyTimeline_query


### 04-25-Use_context.info_to_remove_unnecessary_DynamoDB_calls

No diffs 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-25-Use_context.info_to_remove_unnecessary_DynamoDB_calls

### 04-26-Implement_like_mutation

Diffs:
- Mutation.like.response.vtl: instead of returning string errors, opted to use $util.appendError and send more data down to client if TransactWrite fails, all in an effort to improve debugging.
- LikesTable: name changed to TweetLikesTable

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-26-Implement_like_mutation

### 04-27-Implement_Tweet.liked_nested_resolver

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-27-Implement_Tweet.liked_nested_resolver

### 04-28-Rewrite_tests_with_GraphQL_fragments

Diffs:
- util.js: converted to a folder where all prev methods are in index.js
- util/: adds a new file to contain all the GraphQL fragments; add different fragment registration process and calls the registerAllFragments() in when()
- test/e2e/tweeting: updates tests to expand the tweet object and make use of .toMatchObject

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-28-Rewrite_tests_with_GraphQL_fragments

### 04-29-Add_tests_for_like_mutation

No diffs 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-29-Add_tests_for_like_mutation

### 04-30-Implement_unlike_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-30-Implement_unlike_mutation

### 04-31-Add_tests_for_unlike_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-31-Add_tests_for_unlike_mutation

### 04-32-Implement_getLikes_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-32-Implement_getLikes_query

### 04-33-Add_tests_for_getLikes_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-33-Add_tests_for_getLikes_query

### 04-34-Implement_Profile.tweets_nested_resolver

Diffs:
- tests/e2e/user-profile: adds block to send a tweet and validate that the user.tweets array updates correctly

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-34-Implement_Profile.tweets_nested_resolver

### 04-35-Implement_retweet_mutation

Diffs:
- functions/retweet: implemented using aws-sdk v3 commands
- appsync.yml: Mutation.retweet defined using serverless-appsync-plugin v2 syntax

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-35-Implement_retweet_mutation

### 04-36-Implement_Retweet_nested_resolvers

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-36-Implement_Retweet_nested_resolvers

### 04-37-Add_integration_tests_for_retweet_mutation

Diffs:
- tests/steps/then: mostly implemented aws-sdk v3 patterns for DynamoDB ops; some methods feature different names, but largely follow the intent of the video

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-37-Add_integration_tests_for_retweet_mutation

### 04-38-Add_acceptance_tests_for_retweet_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-38-Add_acceptance_tests_for_retweet_mutation

### 04-39-Implement_unretweet_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-39-Implement_unretweet_mutation

### 04-40-Add_integration_tests_for_unretweet_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-40-Add_integration_tests_for_unretweet_mutation

### 04-41-Add_acceptance_tests_for_unretweet_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-41-Add_acceptance_tests_for_unretweet_mutation

### 04-42-Implement_reply_mutation

Diffs
- lib/dynamodb: instead of a TweetsLib, created a more generic class-based dynamodb util that initialises with region and table and then contains get(id), and transWrite

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-42-Implement_reply_mutation

### 04-43-Add_integration_tests_for_reply_mutation

No diffs in principle, some changes to overall code structure that achieve the same result.

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/04-42-Implement_reply_mutation...04-43-Add_integration_tests_for_reply_mutation

### 04-44-Implement_Reply_nested_resolvers

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-44-Implement_Reply_nested_resolvers


### 04-45-Add_unit_tests_for_Reply.inReplyToUsers_VTL

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-45-Add_unit_tests_for_Reply.inReplyToUsers_VTL

### 04-46-Add_acceptance_tests_for_reply_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-46-Add_acceptance_tests_for_reply_mutation

### 04-47-Implement_follow_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-47-Implement_follow_mutation

### 04-48-Implement_Profile.following_and_Profile.followedBy

No diffs 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-48-Implement_Profile.following_and_Profile.followedBy

### 04-49-Implement_getProfile_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-49-Implement_getProfile_query

### 04-50-Added_tests_for_follow_mutation

Diffs
- Not a diff but I did need to implement OtherProfile.tweets nested resolver
  - Assuming I'm missed a prior instruction

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-50-Added_tests_for_follow_mutation

### 04-51-Distribute_tweets_to_followers

Diffs: 
- Didn't use lodash so implemented a local libs/utils.chunk + added a unit test
- Implemented .batchWrite and .query methods to the lib/dynamodb helper class
- lambda/distributeTweets: helper functions take the table model created using the dynamodb helper class 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-51-Distribute_tweets_to_followers

### 04-52-Add_integration_test_for_distribute-tweets_function

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-52-Add_integration_test_for_distribute-tweets_function

### 04-53-Add_acceptance_test_for_distribute-tweets_function

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-53-Add_acceptance_test_for_distribute-tweets_function

### 04-54-Add_tweets_to_timeline_when_following_someone

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-54-Add_tweets_to_timeline_when_following_someone

### 04-55-Add_integration_tests_for_distribute-tweets-to-follower_function

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-55-Add_integration_tests_for_distribute-tweets-to-follower_function

### 04-56-Add_acceptance_tests_for_distribute-tweets-to-follower_function 

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-56-Add_acceptance_tests_for_distribute-tweets-to-follower

### 04-57-Implement_unfollow_mutation

Diffs: 
- lambda/distributeTweetsToFollower: Didn't change MAX_TWEETS to a string 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-57-Implement_unfollow_mutation

### 04-58-Add_acceptence_tests_for_unfollow_mutation

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-58-Add_acceptence_tests_for_unfollow_mutation

### 04-59-Implement_getFollowers_query

Diffs:
- serverless/appsync.yml: minor changes to the pipeline resolver definitions, due to api changes withing serverless-appsync-plugin

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-59-Implement_getFollowers_query

### 04-61-Add_unit_tests_for_hydrateFollowers.request_template

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-61-Add_unit_tests_for_hydrateFollowers.request_template

### 04-62-Add_acceptance_tests_for_getFollowers_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-62-Add_acceptance_tests_for_getFollowers_query

### 04-63-Implement_getFollowing_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-63-Implement_getFollowing_query

### 04-65-Set_up_cicd_pipeline_with_Github_Actions

Diffs:
- not implemented the actions workflow in `.github/workflows/dev.yml`
- include the workflow file for future reference as `sample_gh_workflows_dev.yml`

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/04-65-Set_up_cicd_pipeline_with_Github_Actions

### 05-23-Profile_page_edit_profile_details 

Diffs: 
- Original: implements uploading via a public bucket, but this is not recommended; a lot harder in 2025 to turn the buckets public than implementing private bucket access
- Implements Cognito Identity Pool; with authenticated and unauthenticated roles; grants S3 access via the IdP; forces private ACLs on PutObject() commands ; allows authenticated users to make PutObject request directly via Amplify client framework
- Removes the use of S3 transfer acceleration for cost saving
- Mutation.editMyProfile: handles optional newProfile parameters; avoids a scenario where params not present would be set to null in DynamoDB
- Lambda: adds new getImagePresignedUrl lambda as a nested resolver to MyProfile type, which receives source signed url, checks expiry, returns new signed url if source url is expired
- Mutation.editMyProfile: adds improved VTL using AWS example, allowing the SET and REMOVE of attributes depending on incoming parameters; adds new unit test; adds new template testing util that hits the Appsync API directly to verify the mapping template; installs the appsync-client for this new util; the new template testing util is less flaky that installed package template compiler and seems more reliable for testing 
- Lambda/get-img-upload-url: refactored to return fileKey as well as the url; gaining certainty over what the fileKey is and removing the need to parse fileKey from the url in the clients

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/05-23-Profile_page_edit_profile_details

Relates to the following frontend release: https://github.com/alanionita/appsyncmasterclass-frontend/releases/tag/05-23-Profile_page_edit_profile_details

### 06-04-Sync_users_and_tweets_to_Algolia

Diffs:
- util/algolia.js: v4 requires that `indexName` is passed to each method and `initIndex` has now been removed; solution here uses curried functions in order to maintain the same api at Lambda level, but introduces some changes to the util; output of init methods also include the original client;
- util/algolia.js: because of the removal of the `initIndex` the design changes slightly to focus on the `client` and not on the `index` thus meaning that we store multiple Algolia clients per logical concern; 
- error handling: introduces further error handling to original

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-04-Sync_users_and_tweets_to_Algolia

### 06-05-Securely_handle_Algolia_admin_keys

Diffs:
- @middy/*: new version of the library is ESM exclusive so the `lambda/sync-*-to-algolia` were converted to .mjs; util/algolia was also converted 
- @middy/ssm: minor changes to the configuration; `throwOnFailedCall` is no longer support and is default when using `etToContext: true`; `cacheExpiryInMillis` is now `cacheExpiry`, calls to SSM for params are made within `fetchData` object; opted to keep the original handler outside of the middy config, to maintain legibility and separation of concerns

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-05-Securely_handle_Algolia_admin_keys

### 06-06-Add_search_to_GraphQL_schema 

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-06-Add_search_to_GraphQL_schema

### 06-07-Implement_search_query

Diffs:
- lib/algolia: due to changes to the api created a shadow .search() method for each index in order to maintain the same call signature inside the handlers; lib util now uses the `.searchSingleIndex()` method
- scripts/*: updates to use aws-sdk v3 and ESM

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-07-Implement_search_query

### 06-08-Add_tests_for_search_query

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-08-Add_tests_for_search_query

### 06-09-Add_getHashTag_to_GraphQL_schema

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-09-Add_getHashTag_to_GraphQL_schema

### 06-10-Implement_getHashTag_query

Diffs:
- lib/extractHashTags: implemented with iterators and new String.matchAll() method; adds unit test for the util
- lambda/reply, */tweet: conditionally adds hashtag property when 
- lambda/search-hashtags: searchTweets implements support for more than one facet and could be reused in future for other facets than hashtags

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-10-Implement_getHashTag_query

### 06-11-Add_tests_for_getHashTag_query

Diffs:
- lib/algolia: due to minor api changes and exiting patter, created a local generic fn lib/searchFacet(), and a new shadow method for searchByFacet() on the TweetsIndex; in the lambda the shadow method is wrapped again to only search by hashtags
- fixes: variety of bugs from the previous release
- testing: adds delays to make sure the search by reply hashtag does not timeout because of index eventual consistency. 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-11-Add_tests_for_getHashTag_query

### 06-13-Add_subscriptions_to_GraphQL_schema

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-13-Add_subscriptions_to_GraphQL_schema

### 06-13.1-Restricting_access_to_onNotified_subscription

Diffs:
- schema: new deployment validation required the removal of `@aws*` annotations from the iNotification interface 
- appsync: new `serverless-appsync-pluging` API rules followed for additional authorisation and Subscription.onNotified resolvers / dataSource definitions

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-13.1-Restricting_access_to_onNotified_subscription

#  06-14-Add_subscription_for_retweets 

Diffs:
- General change is direction: 
  - `aws-appsync` is in maintenance mode, suggesting that new implementations make use of `aws-amplify/api`
  - Current frontend implementation uses `aws-amplify/api` and covers a lot of queries and mutations in this fashion, however it does not support IAM auth
  - `aws-amplify/api` does support API key, but it would be a suprising auth for the machine-to-machine nature of this service e.g. DynamoDB.stream -> Lambda -> Appsync ; it would also require key rotation, as mentioned in the video but not covered
  - To preserve the IAM auth consistency for the service I decided to stay within `aws-appsync` recommendations; of this they also mention `@apollo/client` and suggest a duet of packages to help with this: `aws-appsync-auth-link`, `aws-appsync-subscription-link`
  - Packages allows us to define an Apollo client, and use it's more common API for queries and mutation, whilst connected to AppSync; which in some cases is not 1-2-1 compatible with the GraphQL spec
  - The solution here shows the Apollo Client implementation for v3; v4 is currently not supported due to inconsistencies in the 2 packages from aws-appsync-*
- packages: adds @apollo/client, aws-appsync-auth-link, aws-appsync-
subscription-link, graphql, react, uuid ; where graphql, uuid, and react are dependencies; notably @apollo/client at v3 depends on the react package; 
- lib/dynamodb: functions/notify makes use of the dynamodb lib to query from TweetsTables; styled as and ORM, in MVC style; add new method to .getItem()
- lib/graphql: follows the same ORM style and implements the client config, and .notifyRetweet(); notifyRetweet() api is notably simpler, only requiring query variables; client configures using @apollo/client and the mentioned aws-appsync-* packages described above;
- lib/graphql: credentials are taken from the Lambda `process.env` Execution Context diretly; 
- functions/notify: simplified logic due to more context embedded in the graphql lib style; defined as an ESM file
- serverless: narrowed the lambda/notify resource permissions to the Mutation.notifyRetweet

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-14-Add_subscription_for_retweets

# 06-15-Add_subscription_for_likes

Diffs:
- lib/graphql: adds new method for notifyLiked, similar to last release
- lib/graphql: adds JSDOCS to the methods to make it nice to grok the shape of parameters

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-15-Add_subscription_for_likes

# 06-16-Add_subscription_for_mentions

Diffs: 
- lib/util: contains extractMentions(); write using new style of RegExp look ahead, like extractHashtags prior; part of the util module not lib/tweet, may need to move
- lib/graphql: contains notifyMentioned() logic
- functions/notify: handles the mention logic within the Reply and Tweet __typename; contains local function to get user ids from mentions; calls notifyMentioned with the mentionedUserIds; call to Users follows model pattern and uses aws-sdk v3 command style; 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-16-Add_subscription_for_mentions

# 06-17-Add_subscription_for_replies

Diffs:
- lib/graphql: adds logicfor notifyReplied()
- functions/notify: wrapped up the mention notifications into a handlers; created a new handlers for reply notifications
- serverless/lambda: adds new permissions to allow notify to call the Mutation/notifyReplied field 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-17-Add_subscription_for_replies

# 06-18-Add_e2e_tests_for_retweeted_notifications

Diffs:
- sls/packages: did not need the manifest work, since Appsync api url is already inside the stack outputs; generally avoided the use of the manifest in favour of Output exports that are stored in `.env`
- __tests__/lib: adds a new Appsync client defined in the new pattern with @apollo/client and aws-appsync-*-link packages; did not reuse the existing one because of auth, the test client being configured to use Cognito tokens, instead of IAM; client contains new method for onNotified() subscriptions, following the pattern introduced in past releases
- e2e/notifications: removed afterAll() hook since subscription.unsubscribe was timing out; included the logic within test blocks and added further tests to check that the connection is indeed closed

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-18-Add_e2e_tests_for_retweeted_notifications

# 06-19-Use_serverless-layers_to_reduce_package_size

Diffs:
- serverless-layers: package has been archived, and is no longer an option for production use; seems to have also changed ownership since the video was produced - https://www.npmjs.com/package/@flashcoffee/serverless-layers; 
- serverless-webpack: decided to use this far more popular package to completely bypass the sls packaging; configured with individual service packaging, minimisation, better import resolution; maintains the exported webpack files, and stats;
- webpack.config.js: skips bundling for any @aws-sdk/client-* packages; similar to skipping older aws-sdk package; includes module resolution, bundle analyzer and more 
- __tests__/bundle-summary.js: add new webpack file analyser to quickly see the size of each function
- lib/graphql.mjs: @apollo/client can now use name imports
- results: from a single 88Mb bundle, to per lambda bundles with no bundles greater that 0.6Mb

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-19-Use_serverless-layers_to_reduce_package_size

# 06-20-Add_e2e_tests_for_liked,_replied_and_mentioned_notifications

Diffs:
- test/lib: continues to use the local appsync client as details in past releases; expanding the onNotify method with new query response types

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-20-Add_e2e_tests_for_all_notifications

# 06-21-Support_DM_in_GraphQL_schema

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/06-20-Add_e2e_tests_for_all_notifications...06-21-Support_DM_in_GraphQL_schema

# 06-22-Implement_the_sendDirectMessage_mutation

Diffs: 
- packages: introduces babel and babel-jest and configures Jest to handle esm files; required because of previous decission to write any new lambdas as ESM (.mjs); send-direct-message() is an esm module; 
- steps: adds whenEsm to signal the divergence in patterns; future release planned to refactor the codebase to ESM; all other steps use aws-sdk v3 command patterns and clients
- integration/send-dm: expanded expect value checks to verify full structure of objects from both DirectMessages and Conversations tables
- fn/send-dm: implements aws-sdk v3 clients and command style
- tests/appsyncClient: implements queries to Appsync via the new @apollo/client wrapper; adds sendDirectMessage method; implements existing graphqlFragments; required the use of all fragment due to circular reference within them

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-22-Implement_the_sendDirectMessage_mutation

# 06-23-Implement_the_listConversations_query

Diffs:
- tests/appsync: adds new method for .listConversations()

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-23-Implement_the_listConversations_query

# 06-24-Implement_the_getDirectMessages_query

Diffs:
- tests/appsync: adds new method for .getDirectMessages(); implements fragments again, but could not use iProfileFields generic containing both MyProfile and OtherProfile fields; had to specify each field variation; 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-24-Implement_the_getDirectMessages_query

# 06-25-Support_notifyDMed_in_the_GraphQL_schema

No Diffs 

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-25-

# 06-26-Implement_nofityDMed_notification

Diffs:
- appsync: queries to Appsync implemented via @apollo/client as seen in past release; applies to Lambda and test
- jest: adds `ws` package and polyfill config

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/06-26-Implement_nofityDMed_notification

# 06-29-Configure_per-resolver_caching 

Diffs:
- serverless.yml: configured 2 files for appsync-dev, appsync-prod and included the caching config there; main spec file switches between them based on self:custom.stage
- serverless/appsync.yml: took the opportunity to break some of the resolver definitions into files; did the same for pipelineFunctions, dataSources

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/06-26-Implement_nofityDMed_notification...06-29-Configure_per-resolver_caching

# 06-30-Use_BatchInvoke_to_reduce_the_number_of_Lambda_invocations

Diffs:
- appsync/resolvers: the response vtl is required, and has been defined as a simple JSON return of the $ctx.result
- appsync/resolvers: configure `maxBatchSize` on the resolvers; seems to now be supported by `serverless-appsync-plugin` - https://github.com/sid88in/serverless-appsync-plugin/blob/master/doc/pipeline-functions.md#configuration
- fn/get-tweet-author: previous logic used the first item from payloads to parse the profile type and selection; but the behaviour of batchInvoke is that each payload can be unique, meaning that we can be in a situation where we set all the payloads `.__typename` and `selection` based of the first payload received; the diff code here handles this issue by handling `.__typename` and `selection` per payload 
- fn/get-tweet-author: uses @aws-sdk/client-* and v3 command style
- fn/get-tweet-author: does not use `lodash`, prefering vanilla JS

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/06-29-Configure_per-resolver_caching...06-30-Use_BatchInvoke_to_reduce_the_number_of_Lambda_invocations

# 06-31-Report_individual_errors_in_a_BatchInvoke_request

No diffs

Release: https://github.com/alanionita/appsyncmasterclass-backend/compare/06-30-Use_BatchInvoke_to_reduce_the_number_of_Lambda_invocations...06-31-Report_individual_errors_in_a_BatchInvoke_request

# 07-01-Adds-search-total-count

Usage:
- consider with fronend/07-01
- compare against 06-31

Diffs:
- gql/SearchResultsPage : adds totalCount to help with escape case for infinite loading of research results, and result pagination

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/07-01-Adds-search-total-count

Release (frontend): https://github.com/alanionita/appsyncmasterclass-frontend/releases/tag/07-01-Search_page

# 07-02-Hashtag_page

Usage:
- consider with fronend/07-02
- compare against 07-01

Diffs:
- gql/HastagsResultsPage : adds totalCount to help with escape case for infinite loading of research results, and result pagination

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/07-02-Hashtag_page

Release (frontend): https://github.com/alanionita/appsyncmasterclass-frontend/releases/tag/07-02-Hashtag_page

# 07-03-Notifications_page

Usage:
- consider with frontend/07-03
- compare against 07-02

Diffs:
- UI requirement: Notification list in the frontend requires the display of notification author details (.name, .screenName, .imgUrl); requires the addion of a nested prop .profile on all Notification types
- appsync/permissions: expanded the permissions of iProfile since the Mutation.notify* methods are @aws_iam authed and iProfile was originally @aws_cognit_*
- appsync/resolvers: adds new template resolvers for all Notification types; updates e2e tests (and utils), updates unit tests for each set of templates; resolvers fetch data from UsersTable, using individually unique 'author' properties per type; this is why, although the templates are similar, I opted for split sets instead of a more complex dynamic pair of templates, reused across all Notification types; Response resolvers must resolve the __typename since Appsync resolution cannot discern between MyProfile / OtherProfile
- lambda/utils: updates all the appsync.notify* methods, mostly updating the return of each query; query is currently only returning the details required by the Notification list ui
+ appsync/resolvers: resolvers should really be a batchInvoke, since all Notification type queries to UsersTable share a skeleton 
- packages: `aws-appsync-*-link` packages got a v4 update which support ApolloClient v4; means that external react, ws, uuid dependencies are no longer need - removing them will impact bundle size; however this refactor has been blocked because of difficult debugging of the subscriptions connection within the lambda: similar issue in the `*-frontend` repo was resolved via Networking debugging of Websocket messages, leading to misconfigured headers by `aws-appsync-subscription-link`; debugging in the same way is difficult within the Lambda, complicated by the fact that the `*-backend` repo uses `AWS_IAM` as the authentication type; using the AppSync logs we can see an ApolloClient.UnexpectedError, but from `*-client` repo experience that usually conceals authentication errors that are normally sent on the Websocket connection; Owing to this development the module updates have been reverted

Release (frontend): https://github.com/alanionita/appsyncmasterclass-frontend/releases/tag/07-03-Notifications_page

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/07-03-Notifications_page

# 08-03-Configure_Kinesis_Firehose

- serverless/*: adds the new resources under a "service" file of serverless/analytics.yml; existing patterns follow a "resource type" (Dynamo, Lambda etc) based file pattern, and this change introduces the "service" (as in a backend slice or micro-service) based pattern; change was made in order to contain and abstract resources that go together away from polluting the rest of the app
- serverless/analytics: adds new Processor config for adding the `\n` delimiter without the need of a Lambda
- Lambda: Won't implement since it's now redundant
- IAM role: Impacted by above, no longer needs Lambda invoke permissions
- Video suggest that in order to read the downloaded Firehose S3 files, you must rename them, and that they are decompressed by default; this is no longer the case; in order to access the data you must extract the downloaded files with a local archive program - decompressing the files in the process; Firehose also now supports config for automatic decompression as a Processor, but it's not on by default

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/08-03-Configure_Kinesis_Firehose

# 08-04-Configure_Cognito_Identity_Pool_and_IAM_role

serverless/cognito: 
- Existing logic already implemented the Cognito Identity Pools in order to refresh S3 imgUrls; enables the unauthenticated identities, adds serverside token check;
- Adds new policy `CgAuthPolicy` which contains the Firehose rules, and attached it to `CgIDPoolAuthRole`
- Adds new Firehose rules to `CgUnauthPolicy`

serverless.yml:
- Adds new outputs with the existing stack names

test-cognito-identity.mjs:
- Defined as ESM
- Installed the `@aws-sdk` v3 packages for credential-provideos and client-firehose
- Generally structured the script as a Lamda with self-invoking handler()
- credentials: fetched using fromCognitoIdentityPool() v3 api; added error handling and async/await;
- putFirehoseEvents: use v3 command based api for Firehose; added error handling; depends on credentials object
- .env: added the idToken to env.variables in order to protect the repo from data leaks
- erors: discerns between regular errors and aws-sdk errors, making for richer context

Process:
- Video encouradges the use of `serverless-env` in order to receive sls.Outputs as .env
- This variation does not use `serverless-env` for security considerations, adding a manual requirement instead
- Outputs are still defined sls.Outputs
- Environment variables must be updated manually by:
  - `npm run deploy`
  - Navigate to AWS Console / CloudFormation
  - Access the appsyncmasterclass-* stack
  - Go to 'Outputs' tab
  - Copy the relevant values from here

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/08-04-Configure_Cognito_Identity_Pool_and_IAM_role

# 08-05_Update_schema_to_return_Kinesis_Firehose_stream_name

Same logic, differrent locations for some:
- appsync-dev.yml, for substitutions
- serverless/appsync/resolvers/query.yml, for resolver mapping to query

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/08-05_Update_schema_to_return_Kinesis_Firehose_stream_name

# 08-06-How_to_create_unauthenticated_GraphQL_operations_in_AppSync

No changes

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/08-06-How_to_create_unauthenticated_GraphQL_operations_in_AppSync

# 08-08-How-to-configure-Glue-with-CloudFormation

Usage:
- compare against 08-06 (08-07 had no release)

- On the course 08-07 showcased how to create the analytics Glue and Athena resources manually
- In 08-08, we find a writen guide with samples of how we should create the resources as IaC definitions
- This release implements those change in a refreshed format
- Main caveat is that the crawler is on demand
- Athena has a max of 1mb query size, for cost cutting

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/08-08-How-to-configure-Glue-with-CloudFormation

# 10-02-Configure_AppSync_Logging

- serverless-appsync-plugin: minor api change, adds retentionPolicy 7days
- sls/appsync-*.yml: left in defaults because I probably will toggle them off
- IAM: further restricted AppSyncLoggingServiceRole to access just AppSync api log groups; attempted to limit it to our specific GraphQLApi.ApiId but hit a circular dependency

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/10-02-Configure_AppSync_Logging

# 10-03-Implement_sampling_for_resolver_logs

- Tests: adds integration tests for verifying the functionality of the set-log-level Lambda; required that the lambda is componetised more in order to reuse methods in the tests; makes use of dotenv to test dynamically with different environments
- Lambda: makes use of @aws-sdk v3 api and command-style syntax; adds extra error handling

serverless-plugin-ifelse: 
- Won't implement due to lack of releases and security concerns; likely a stale project
- Previously used a file-based approach for deploying stage-scope `appsync-{stage}.yml`, but with a key limitation: new additions had to be present in all stages; thus a requirement for a `base.yml` came to be;
- For `functions:` aimed to use yaml string concat with multiple file() imports, but hit limitations with the `sls` package v3.39; v3.39 is the last open-source version so any solution designed around would also be tech debt;
- Opted instead for a bash script that concatenates the `base.yml` and any corresponding `stage-*.yml` files into `index-{stage}.yml`; the script is registered on a pre-hook to deploy, and the main `serverless.yml` references the `index-{stage}.yml`; a local solution with less security implications, more execution trust, and more autonomy; `functions/_dist` is ignored by git, same as all `index-{stage}.yml` by proxy.

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/10-03-Implement_sampling_for_resolver_logs

# 10-05-Configure_tracing_with_X-Ray

Compare against:
- 10-03; 10-04 did not have a release

- serverless-iam-roles-per-function: won't implement global inheritance of provider role; implemented the inheritence per function, ie. getTweetAuthor()
- serverless.yml: change in role definition syntax, under `iam:`
- packages: uses `aws-xray-sdk` v3.12; implemented in ESM style since getTweetAuthor is an ESM lambda;

functions/get-tweet-author
- Adds simple unit and event payload
- Uses `aws-xray-sdk` meta package (includes *core); 
- Implements the sdk v3 methods; 
- NOTE: 
  - .captureAWS() incompatible with aws-sdk v3
  - @smithy/* require for this; package needs excaping from `webpack.config.js / externals / *` definitions

Release: https://github.com/alanionita/appsyncmasterclass-backend/releases/tag/10-05-Configure_tracing_with_X-Ray

# 10-10-Configure_lumigo

Compare against:
- 10-05

Diffs:
- serverless.yml: lumigo-token didn't require decryption; in this version of sls the `~true` (for Parameter Store / Secure String decryption) was causing a package validation error; works without decryption 
- lumigo-tracer: thought the ESM lambdas might require special config as mentioned in the docs for Typescript ESM config; not required

Release:

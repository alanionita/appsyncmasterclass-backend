#!/bin/bash

REGION=eu-west-2

# $1 - client-id
# $2 - email, used as username
# $3 - password
# $4 - name

aws cognito-idp --region $REGION sign-up --client-id $1 --username $2 --password $3 --user-attributes Name="name",Value="$4"
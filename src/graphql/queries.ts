/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getTrip = /* GraphQL */ `query GetTrip($id: ID!) {
  getTrip(id: $id) {
    id
    name
    currency
    members {
      nextToken
      __typename
    }
    expenses {
      nextToken
      __typename
    }
    debts
    totalAmtLeft
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetTripQueryVariables, APITypes.GetTripQuery>;
export const listTrips = /* GraphQL */ `query ListTrips(
  $filter: ModelTripFilterInput
  $limit: Int
  $nextToken: String
) {
  listTrips(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      currency
      debts
      totalAmtLeft
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListTripsQueryVariables, APITypes.ListTripsQuery>;
export const getMember = /* GraphQL */ `query GetMember($id: ID!) {
  getMember(id: $id) {
    id
    username
    fullName
    tripId
    trip {
      id
      name
      currency
      debts
      totalAmtLeft
      createdAt
      updatedAt
      __typename
    }
    amtLeft
    owesTotalMap
    createdAt
    updatedAt
    tripMembersId
    __typename
  }
}
` as GeneratedQuery<APITypes.GetMemberQueryVariables, APITypes.GetMemberQuery>;
export const listMembers = /* GraphQL */ `query ListMembers(
  $filter: ModelMemberFilterInput
  $limit: Int
  $nextToken: String
) {
  listMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      username
      fullName
      tripId
      amtLeft
      owesTotalMap
      createdAt
      updatedAt
      tripMembersId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMembersQueryVariables,
  APITypes.ListMembersQuery
>;
export const getExpense = /* GraphQL */ `query GetExpense($id: ID!) {
  getExpense(id: $id) {
    id
    tripId
    trip {
      id
      name
      currency
      debts
      totalAmtLeft
      createdAt
      updatedAt
      __typename
    }
    activityName
    amount
    currency
    paidBy
    sharedWith {
      nextToken
      __typename
    }
    paidByAndAmounts
    createdAt
    updatedAt
    tripExpensesId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetExpenseQueryVariables,
  APITypes.GetExpenseQuery
>;
export const listExpenses = /* GraphQL */ `query ListExpenses(
  $filter: ModelExpenseFilterInput
  $limit: Int
  $nextToken: String
) {
  listExpenses(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      tripId
      activityName
      amount
      currency
      paidBy
      paidByAndAmounts
      createdAt
      updatedAt
      tripExpensesId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListExpensesQueryVariables,
  APITypes.ListExpensesQuery
>;
export const getExpenseShare = /* GraphQL */ `query GetExpenseShare($id: ID!) {
  getExpenseShare(id: $id) {
    id
    expenseId
    expense {
      id
      tripId
      activityName
      amount
      currency
      paidBy
      paidByAndAmounts
      createdAt
      updatedAt
      tripExpensesId
      __typename
    }
    payeeName
    amount
    currency
    createdAt
    updatedAt
    expenseSharedWithId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetExpenseShareQueryVariables,
  APITypes.GetExpenseShareQuery
>;
export const listExpenseShares = /* GraphQL */ `query ListExpenseShares(
  $filter: ModelExpenseShareFilterInput
  $limit: Int
  $nextToken: String
) {
  listExpenseShares(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      expenseId
      payeeName
      amount
      currency
      createdAt
      updatedAt
      expenseSharedWithId
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListExpenseSharesQueryVariables,
  APITypes.ListExpenseSharesQuery
>;

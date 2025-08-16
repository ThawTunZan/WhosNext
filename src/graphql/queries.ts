/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    username
    email
    fullName
    avatarUrl
    premiumStatus
    friends
    incomingFriendRequests {
      id
      username
      status
      timestamp
      createdAt
      updatedAt
      __typename
    }
    outgoingFriendRequests {
      id
      username
      status
      timestamp
      createdAt
      updatedAt
      __typename
    }
    trips
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      username
      email
      fullName
      avatarUrl
      premiumStatus
      friends
      trips
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getFriendRequest = /* GraphQL */ `query GetFriendRequest($id: ID!) {
  getFriendRequest(id: $id) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetFriendRequestQueryVariables,
  APITypes.GetFriendRequestQuery
>;
export const listFriendRequests = /* GraphQL */ `query ListFriendRequests(
  $filter: ModelFriendRequestFilterInput
  $limit: Int
  $nextToken: String
) {
  listFriendRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      username
      status
      timestamp
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListFriendRequestsQueryVariables,
  APITypes.ListFriendRequestsQuery
>;
export const getTrip = /* GraphQL */ `query GetTrip($id: ID!) {
  getTrip(id: $id) {
    id
    name
    currency
    createdBy
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
    totalBudget
    startDate
    endDate
    isTripPremium
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
      createdBy
      debts
      totalAmtLeft
      totalBudget
      startDate
      endDate
      isTripPremium
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
      createdBy
      debts
      totalAmtLeft
      totalBudget
      startDate
      endDate
      isTripPremium
      createdAt
      updatedAt
      __typename
    }
    amtLeft
    owesTotalMap
    addMemberType
    budget
    receiptsCount
    createdAt
    updatedAt
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
      addMemberType
      budget
      receiptsCount
      createdAt
      updatedAt
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
      createdBy
      debts
      totalAmtLeft
      totalBudget
      startDate
      endDate
      isTripPremium
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
      __typename
    }
    payeeName
    amount
    currency
    createdAt
    updatedAt
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
export const getUserByUsername = /* GraphQL */ `query GetUserByUsername(
  $username: String!
  $sortDirection: ModelSortDirection
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  getUserByUsername(
    username: $username
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      username
      email
      fullName
      avatarUrl
      premiumStatus
      friends
      trips
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetUserByUsernameQueryVariables,
  APITypes.GetUserByUsernameQuery
>;
export const getTripsByCreator = /* GraphQL */ `query GetTripsByCreator(
  $createdBy: String!
  $sortDirection: ModelSortDirection
  $filter: ModelTripFilterInput
  $limit: Int
  $nextToken: String
) {
  getTripsByCreator(
    createdBy: $createdBy
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      currency
      createdBy
      debts
      totalAmtLeft
      totalBudget
      startDate
      endDate
      isTripPremium
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetTripsByCreatorQueryVariables,
  APITypes.GetTripsByCreatorQuery
>;
export const getMembersByUsername = /* GraphQL */ `query GetMembersByUsername(
  $username: String!
  $sortDirection: ModelSortDirection
  $filter: ModelMemberFilterInput
  $limit: Int
  $nextToken: String
) {
  getMembersByUsername(
    username: $username
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      username
      fullName
      tripId
      amtLeft
      owesTotalMap
      addMemberType
      budget
      receiptsCount
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMembersByUsernameQueryVariables,
  APITypes.GetMembersByUsernameQuery
>;
export const getMembersByTrip = /* GraphQL */ `query GetMembersByTrip(
  $tripId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelMemberFilterInput
  $limit: Int
  $nextToken: String
) {
  getMembersByTrip(
    tripId: $tripId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      username
      fullName
      tripId
      amtLeft
      owesTotalMap
      addMemberType
      budget
      receiptsCount
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetMembersByTripQueryVariables,
  APITypes.GetMembersByTripQuery
>;
export const getExpensesByTrip = /* GraphQL */ `query GetExpensesByTrip(
  $tripId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelExpenseFilterInput
  $limit: Int
  $nextToken: String
) {
  getExpensesByTrip(
    tripId: $tripId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetExpensesByTripQueryVariables,
  APITypes.GetExpensesByTripQuery
>;
export const getSharesByExpense = /* GraphQL */ `query GetSharesByExpense(
  $expenseId: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelExpenseShareFilterInput
  $limit: Int
  $nextToken: String
) {
  getSharesByExpense(
    expenseId: $expenseId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      expenseId
      payeeName
      amount
      currency
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSharesByExpenseQueryVariables,
  APITypes.GetSharesByExpenseQuery
>;

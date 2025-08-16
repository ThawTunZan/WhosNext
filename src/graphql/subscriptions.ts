/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateDebt = /* GraphQL */ `subscription OnCreateDebt($filter: ModelSubscriptionDebtFilterInput) {
  onCreateDebt(filter: $filter) {
    id
    tripId
    currency
    debtor
    creditor
    amount
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDebtSubscriptionVariables,
  APITypes.OnCreateDebtSubscription
>;
export const onUpdateDebt = /* GraphQL */ `subscription OnUpdateDebt($filter: ModelSubscriptionDebtFilterInput) {
  onUpdateDebt(filter: $filter) {
    id
    tripId
    currency
    debtor
    creditor
    amount
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDebtSubscriptionVariables,
  APITypes.OnUpdateDebtSubscription
>;
export const onDeleteDebt = /* GraphQL */ `subscription OnDeleteDebt($filter: ModelSubscriptionDebtFilterInput) {
  onDeleteDebt(filter: $filter) {
    id
    tripId
    currency
    debtor
    creditor
    amount
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDebtSubscriptionVariables,
  APITypes.OnDeleteDebtSubscription
>;
export const onCreateUser = /* GraphQL */ `subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
  onCreateUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
  onUpdateUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
  onDeleteUser(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateFriendRequest = /* GraphQL */ `subscription OnCreateFriendRequest(
  $filter: ModelSubscriptionFriendRequestFilterInput
) {
  onCreateFriendRequest(filter: $filter) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateFriendRequestSubscriptionVariables,
  APITypes.OnCreateFriendRequestSubscription
>;
export const onUpdateFriendRequest = /* GraphQL */ `subscription OnUpdateFriendRequest(
  $filter: ModelSubscriptionFriendRequestFilterInput
) {
  onUpdateFriendRequest(filter: $filter) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateFriendRequestSubscriptionVariables,
  APITypes.OnUpdateFriendRequestSubscription
>;
export const onDeleteFriendRequest = /* GraphQL */ `subscription OnDeleteFriendRequest(
  $filter: ModelSubscriptionFriendRequestFilterInput
) {
  onDeleteFriendRequest(filter: $filter) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteFriendRequestSubscriptionVariables,
  APITypes.OnDeleteFriendRequestSubscription
>;
export const onCreateTrip = /* GraphQL */ `subscription OnCreateTrip($filter: ModelSubscriptionTripFilterInput) {
  onCreateTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTripSubscriptionVariables,
  APITypes.OnCreateTripSubscription
>;
export const onUpdateTrip = /* GraphQL */ `subscription OnUpdateTrip($filter: ModelSubscriptionTripFilterInput) {
  onUpdateTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTripSubscriptionVariables,
  APITypes.OnUpdateTripSubscription
>;
export const onDeleteTrip = /* GraphQL */ `subscription OnDeleteTrip($filter: ModelSubscriptionTripFilterInput) {
  onDeleteTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteTripSubscriptionVariables,
  APITypes.OnDeleteTripSubscription
>;
export const onCreateMember = /* GraphQL */ `subscription OnCreateMember($filter: ModelSubscriptionMemberFilterInput) {
  onCreateMember(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMemberSubscriptionVariables,
  APITypes.OnCreateMemberSubscription
>;
export const onUpdateMember = /* GraphQL */ `subscription OnUpdateMember($filter: ModelSubscriptionMemberFilterInput) {
  onUpdateMember(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMemberSubscriptionVariables,
  APITypes.OnUpdateMemberSubscription
>;
export const onDeleteMember = /* GraphQL */ `subscription OnDeleteMember($filter: ModelSubscriptionMemberFilterInput) {
  onDeleteMember(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMemberSubscriptionVariables,
  APITypes.OnDeleteMemberSubscription
>;
export const onCreateExpense = /* GraphQL */ `subscription OnCreateExpense($filter: ModelSubscriptionExpenseFilterInput) {
  onCreateExpense(filter: $filter) {
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
      payeeName
      amount
      currency
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateExpenseSubscriptionVariables,
  APITypes.OnCreateExpenseSubscription
>;
export const onUpdateExpense = /* GraphQL */ `subscription OnUpdateExpense($filter: ModelSubscriptionExpenseFilterInput) {
  onUpdateExpense(filter: $filter) {
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
      payeeName
      amount
      currency
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateExpenseSubscriptionVariables,
  APITypes.OnUpdateExpenseSubscription
>;
export const onDeleteExpense = /* GraphQL */ `subscription OnDeleteExpense($filter: ModelSubscriptionExpenseFilterInput) {
  onDeleteExpense(filter: $filter) {
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
      payeeName
      amount
      currency
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteExpenseSubscriptionVariables,
  APITypes.OnDeleteExpenseSubscription
>;

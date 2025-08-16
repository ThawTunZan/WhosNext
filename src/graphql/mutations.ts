/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createDebt = /* GraphQL */ `mutation CreateDebt(
  $input: CreateDebtInput!
  $condition: ModelDebtConditionInput
) {
  createDebt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateDebtMutationVariables,
  APITypes.CreateDebtMutation
>;
export const updateDebt = /* GraphQL */ `mutation UpdateDebt(
  $input: UpdateDebtInput!
  $condition: ModelDebtConditionInput
) {
  updateDebt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateDebtMutationVariables,
  APITypes.UpdateDebtMutation
>;
export const deleteDebt = /* GraphQL */ `mutation DeleteDebt(
  $input: DeleteDebtInput!
  $condition: ModelDebtConditionInput
) {
  deleteDebt(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteDebtMutationVariables,
  APITypes.DeleteDebtMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createFriendRequest = /* GraphQL */ `mutation CreateFriendRequest(
  $input: CreateFriendRequestInput!
  $condition: ModelFriendRequestConditionInput
) {
  createFriendRequest(input: $input, condition: $condition) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateFriendRequestMutationVariables,
  APITypes.CreateFriendRequestMutation
>;
export const updateFriendRequest = /* GraphQL */ `mutation UpdateFriendRequest(
  $input: UpdateFriendRequestInput!
  $condition: ModelFriendRequestConditionInput
) {
  updateFriendRequest(input: $input, condition: $condition) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateFriendRequestMutationVariables,
  APITypes.UpdateFriendRequestMutation
>;
export const deleteFriendRequest = /* GraphQL */ `mutation DeleteFriendRequest(
  $input: DeleteFriendRequestInput!
  $condition: ModelFriendRequestConditionInput
) {
  deleteFriendRequest(input: $input, condition: $condition) {
    id
    username
    status
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteFriendRequestMutationVariables,
  APITypes.DeleteFriendRequestMutation
>;
export const createTrip = /* GraphQL */ `mutation CreateTrip(
  $input: CreateTripInput!
  $condition: ModelTripConditionInput
) {
  createTrip(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateTripMutationVariables,
  APITypes.CreateTripMutation
>;
export const updateTrip = /* GraphQL */ `mutation UpdateTrip(
  $input: UpdateTripInput!
  $condition: ModelTripConditionInput
) {
  updateTrip(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateTripMutationVariables,
  APITypes.UpdateTripMutation
>;
export const deleteTrip = /* GraphQL */ `mutation DeleteTrip(
  $input: DeleteTripInput!
  $condition: ModelTripConditionInput
) {
  deleteTrip(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteTripMutationVariables,
  APITypes.DeleteTripMutation
>;
export const createMember = /* GraphQL */ `mutation CreateMember(
  $input: CreateMemberInput!
  $condition: ModelMemberConditionInput
) {
  createMember(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateMemberMutationVariables,
  APITypes.CreateMemberMutation
>;
export const updateMember = /* GraphQL */ `mutation UpdateMember(
  $input: UpdateMemberInput!
  $condition: ModelMemberConditionInput
) {
  updateMember(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateMemberMutationVariables,
  APITypes.UpdateMemberMutation
>;
export const deleteMember = /* GraphQL */ `mutation DeleteMember(
  $input: DeleteMemberInput!
  $condition: ModelMemberConditionInput
) {
  deleteMember(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteMemberMutationVariables,
  APITypes.DeleteMemberMutation
>;
export const createExpense = /* GraphQL */ `mutation CreateExpense(
  $input: CreateExpenseInput!
  $condition: ModelExpenseConditionInput
) {
  createExpense(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateExpenseMutationVariables,
  APITypes.CreateExpenseMutation
>;
export const updateExpense = /* GraphQL */ `mutation UpdateExpense(
  $input: UpdateExpenseInput!
  $condition: ModelExpenseConditionInput
) {
  updateExpense(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateExpenseMutationVariables,
  APITypes.UpdateExpenseMutation
>;
export const deleteExpense = /* GraphQL */ `mutation DeleteExpense(
  $input: DeleteExpenseInput!
  $condition: ModelExpenseConditionInput
) {
  deleteExpense(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteExpenseMutationVariables,
  APITypes.DeleteExpenseMutation
>;

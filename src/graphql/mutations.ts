/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createTrip = /* GraphQL */ `mutation CreateTrip(
  $input: CreateTripInput!
  $condition: ModelTripConditionInput
) {
  createTrip(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteExpenseMutationVariables,
  APITypes.DeleteExpenseMutation
>;
export const createExpenseShare = /* GraphQL */ `mutation CreateExpenseShare(
  $input: CreateExpenseShareInput!
  $condition: ModelExpenseShareConditionInput
) {
  createExpenseShare(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateExpenseShareMutationVariables,
  APITypes.CreateExpenseShareMutation
>;
export const updateExpenseShare = /* GraphQL */ `mutation UpdateExpenseShare(
  $input: UpdateExpenseShareInput!
  $condition: ModelExpenseShareConditionInput
) {
  updateExpenseShare(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateExpenseShareMutationVariables,
  APITypes.UpdateExpenseShareMutation
>;
export const deleteExpenseShare = /* GraphQL */ `mutation DeleteExpenseShare(
  $input: DeleteExpenseShareInput!
  $condition: ModelExpenseShareConditionInput
) {
  deleteExpenseShare(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteExpenseShareMutationVariables,
  APITypes.DeleteExpenseShareMutation
>;

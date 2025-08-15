/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateTrip = /* GraphQL */ `subscription OnCreateTrip($filter: ModelSubscriptionTripFilterInput) {
  onCreateTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateTripSubscriptionVariables,
  APITypes.OnCreateTripSubscription
>;
export const onUpdateTrip = /* GraphQL */ `subscription OnUpdateTrip($filter: ModelSubscriptionTripFilterInput) {
  onUpdateTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateTripSubscriptionVariables,
  APITypes.OnUpdateTripSubscription
>;
export const onDeleteTrip = /* GraphQL */ `subscription OnDeleteTrip($filter: ModelSubscriptionTripFilterInput) {
  onDeleteTrip(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteExpenseSubscriptionVariables,
  APITypes.OnDeleteExpenseSubscription
>;
export const onCreateExpenseShare = /* GraphQL */ `subscription OnCreateExpenseShare(
  $filter: ModelSubscriptionExpenseShareFilterInput
) {
  onCreateExpenseShare(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateExpenseShareSubscriptionVariables,
  APITypes.OnCreateExpenseShareSubscription
>;
export const onUpdateExpenseShare = /* GraphQL */ `subscription OnUpdateExpenseShare(
  $filter: ModelSubscriptionExpenseShareFilterInput
) {
  onUpdateExpenseShare(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateExpenseShareSubscriptionVariables,
  APITypes.OnUpdateExpenseShareSubscription
>;
export const onDeleteExpenseShare = /* GraphQL */ `subscription OnDeleteExpenseShare(
  $filter: ModelSubscriptionExpenseShareFilterInput
) {
  onDeleteExpenseShare(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteExpenseShareSubscriptionVariables,
  APITypes.OnDeleteExpenseShareSubscription
>;

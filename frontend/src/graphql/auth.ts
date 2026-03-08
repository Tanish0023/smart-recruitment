import { gql } from "@apollo/client";

export const LOGIN_APPLICANT = gql`
  mutation ApplicantLogin($username: String!, $password: String!) {
    applicantLogin(username: $username, password: $password) {
      token
      user {
        id
        username
        email
        isRecruiter
      }
    }
  }
`;

export const LOGIN_COMPANY = gql`
  mutation CompanyLogin(
    $username: String!
    $password: String!
  ) {
    companyLogin(username: $username, password: $password) {
      token
      user {
        id
        username
        email
        isRecruiter
        company {
          id
          name
        }
      }
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser(
    $username: String!
    $email: String!
    $password: String!
    $isRecruiter: Boolean
    $companyId: Int
  ) {
    register(
      username: $username
      email: $email
      password: $password
      isRecruiter: $isRecruiter
      companyId: $companyId
    ) {
      user {
        id
        username
        email
        isRecruiter
      }
    }
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($name: String!, $website: String) {
    createCompany(name: $name, website: $website) {
      company {
        id
        name
        website
      }
    }
  }
`;

export const GET_COMPANIES = gql`
  query GetCompanies {
    companies {
      id
      name
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      username
      email
      isRecruiter
      company {
        id
        name
      }
    }
  }
`;

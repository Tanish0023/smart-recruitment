import { gql } from "@apollo/client";

export const LOGIN_APPLICANT = gql`
  mutation ApplicantLogin($username: String!, $password: String!) {
    applicantLogin(username: $username, password: $password) {
      token
      user {
        id
        username
        email
        firstName
        lastName
        isRecruiter
        phone
        location

        skills {
          id
          name
        }

        onboardingCompletedAt
        primaryResumeUrl
        profileCompletion
        profileSections
        canApply
        nudgeMessages
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
        firstName
        lastName
        isRecruiter
        phone
        location

        skills {
          id
          name
        }

        onboardingCompletedAt
        primaryResumeUrl
        profileCompletion
        profileSections
        canApply
        nudgeMessages
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
        firstName
        lastName
        isRecruiter
        phone
        location

        skills {
          id
          name
        }

        onboardingCompletedAt
        primaryResumeUrl
        profileCompletion
        profileSections
        canApply
        nudgeMessages
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
      firstName
      lastName
      isRecruiter
      phone
      location

      skills {
        id
        name
      }

      onboardingCompletedAt
      primaryResumeUrl
      profileCompletion
      profileSections
      canApply
      nudgeMessages
      company {
        id
        name
      }
    }
  }
`;

export const COMPLETE_APPLICANT_ONBOARDING = gql`
  mutation CompleteApplicantOnboarding(
    $firstName: String!
    $lastName: String!
    $phone: String!
    $location: String!

  ) {
    completeApplicantOnboarding(
      firstName: $firstName
      lastName: $lastName
      phone: $phone
      location: $location

    ) {
      user {
        id
        firstName
        lastName
        phone
        location

        profileCompletion
        profileSections
        canApply
        nudgeMessages
      }
    }
  }
`;

export const UPDATE_APPLICANT_PROFILE_SECTION = gql`
  mutation UpdateApplicantProfileSection($section: String!, $items: GenericScalar!) {
    updateApplicantProfileSection(section: $section, items: $items) {
      user {
        id
        skills {
          id
          name
        }

        profileCompletion
        profileSections
        canApply
        nudgeMessages
      }
    }
  }
`;

export const UPLOAD_PRIMARY_RESUME = gql`
  mutation UploadPrimaryResume($resume: Upload!) {
    uploadPrimaryResume(resume: $resume) {
      user {
        id
        primaryResumeUrl
        profileCompletion
        profileSections
        canApply
        nudgeMessages
      }
    }
  }
`;

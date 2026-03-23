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
      message
      user {
        id
        username
        email
        isVerified
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
  mutation CreateCompany($name: String!, $email: String!, $website: String) {
    createCompany(name: $name, email: $email, website: $website) {
      message
      company {
        id
        name
        email
        website
        isVerified
      }
    }
  }
`;

export const VERIFY_USER_OTP = gql`
  mutation VerifyUserOtp($email: String!, $otp: String!) {
    verifyUserOtp(email: $email, otp: $otp) {
      success
      message
      user {
        id
        email
        isVerified
      }
    }
  }
`;

export const RESEND_USER_OTP = gql`
  mutation ResendUserOtp($email: String!) {
    resendUserOtp(email: $email) {
      success
      message
    }
  }
`;

export const VERIFY_COMPANY_OTP = gql`
  mutation VerifyCompanyOtp($email: String!, $otp: String!) {
    verifyCompanyOtp(email: $email, otp: $otp) {
      success
      message
      company {
        id
        email
        isVerified
      }
    }
  }
`;

export const RESEND_COMPANY_OTP = gql`
  mutation ResendCompanyOtp($email: String!) {
    resendCompanyOtp(email: $email) {
      success
      message
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
  mutation UploadPrimaryResume($resume: Upload!, $updateBasicDetails: Boolean = true) {
    uploadPrimaryResume(resume: $resume, updateBasicDetails: $updateBasicDetails) {
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
